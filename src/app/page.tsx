'use client';

import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { CATEGORIES, Category, Expense } from '@/types';
import { formatCurrency, exportToCSV } from '@/lib/utils';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  PlusCircle, Trash2, Edit2, Download, Search, LayoutDashboard, ListOrdered, Wallet 
} from 'lucide-react';
import { format, isSameMonth, parseISO } from 'date-fns';

const COLORS = ['#CF4500', '#F37338', '#3860BE', '#9A3A0A', '#141413', '#696969'];

export default function ExpenseTrackerApp() {
  const { expenses, isLoaded, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: CATEGORIES[0] as Category,
    description: '',
  });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');

  // Computed Analytics
  const analytics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const thisMonth = expenses.reduce((sum, exp) => {
      if (isSameMonth(parseISO(exp.date), new Date())) return sum + exp.amount;
      return sum;
    }, 0);

    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const topCategory = chartData.length > 0 ? chartData[0].name : 'N/A';

    // Monthly trend data
    const monthlyData = expenses.reduce((acc, exp) => {
      const monthKey = format(parseISO(exp.date), 'MMM yyyy');
      acc[monthKey] = (acc[monthKey] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    // Daily spending for last 30 days
    const dailyData = expenses.reduce((acc, exp) => {
      const dateKey = exp.date;
      acc[dateKey] = (acc[dateKey] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const dailyTrend = Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    return { total, thisMonth, chartData, topCategory, monthlyTrend, dailyTrend };
  }, [expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, filterCategory]);

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || isNaN(Number(formData.amount))) return;

    const expenseData = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
    };

    if (editingId) {
      updateExpense({ ...expenseData, id: editingId });
      setEditingId(null);
    } else {
      addExpense(expenseData);
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: CATEGORIES[0],
      description: '',
    });
    setActiveTab('expenses');
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
    });
    setEditingId(expense.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-gray">Loading your finances...</div>;

  return (
    <div className="min-h-screen bg-canvas-cream text-ink-black font-sans">
      {/* Header - Floating Nav Pill */}
      <header className="sticky top-6 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="bg-white shadow-nav rounded-pill px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-ink-black p-2 rounded-2xl text-white">
                <Wallet size={24} />
              </div>
              <h1 className="text-lg font-medium text-ink-black">ExpenseTracker</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === 'dashboard' ? 'bg-ink-black text-canvas-cream' : 'text-ink-black hover:bg-lifted-cream'
                }`}
              >
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === 'expenses' ? 'bg-ink-black text-canvas-cream' : 'text-ink-black hover:bg-lifted-cream'
                }`}
              >
                <ListOrdered size={16} /> <span className="hidden sm:inline">Expenses</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-lifted-cream p-6 rounded-xl shadow-card">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              {editingId ? <Edit2 size={18} className="text-signal-orange" /> : <PlusCircle size={18} className="text-signal-orange" />}
              {editingId ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-black mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-ink-black/20 rounded-md focus:ring-2 focus:ring-signal-orange focus:border-signal-orange outline-none transition-all bg-white text-ink-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-black mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-gray">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-ink-black/20 rounded-md focus:ring-2 focus:ring-signal-orange focus:border-signal-orange outline-none transition-all bg-white text-ink-black"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-black mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full px-4 py-2.5 border border-ink-black/20 rounded-md focus:ring-2 focus:ring-signal-orange focus:border-signal-orange outline-none transition-all bg-white text-ink-black"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-black mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-ink-black/20 rounded-md focus:ring-2 focus:ring-signal-orange focus:border-signal-orange outline-none transition-all bg-white text-ink-black"
                  placeholder="e.g., Groceries"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-ink-black hover:bg-charcoal text-canvas-cream py-2.5 rounded-md font-medium transition-colors"
                >
                  {editingId ? 'Update Expense' : 'Save Expense'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ date: new Date().toISOString().split('T')[0], amount: '', category: CATEGORIES[0], description: '' });
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-lifted-cream text-ink-black border border-ink-black/20 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic Content based on Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'dashboard' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-lifted-cream p-5 rounded-xl shadow-card">
                  <p className="text-sm font-medium text-slate-gray">Total Spending</p>
                  <p className="text-2xl font-medium text-ink-black mt-1">{formatCurrency(analytics.total)}</p>
                </div>
                <div className="bg-lifted-cream p-5 rounded-xl shadow-card">
                  <p className="text-sm font-medium text-slate-gray">This Month</p>
                  <p className="text-2xl font-medium text-signal-orange mt-1">{formatCurrency(analytics.thisMonth)}</p>
                </div>
                <div className="bg-lifted-cream p-5 rounded-xl shadow-card">
                  <p className="text-sm font-medium text-slate-gray">Top Category</p>
                  <p className="text-2xl font-medium text-link-blue mt-1">{analytics.topCategory}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-lifted-cream p-6 rounded-xl shadow-card">
                <h3 className="text-lg font-medium mb-6">Spending by Category</h3>
                {expenses.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: unknown) => formatCurrency(Number(value || 0))}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-dust-taupe border-2 border-dashed border-ink-black/10 rounded-xl">
                    No data to display. Add expenses to see charts.
                  </div>
                )}
              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-lifted-cream p-6 rounded-xl shadow-card">
                <h3 className="text-lg font-medium mb-6">Monthly Spending Trend</h3>
                {analytics.monthlyTrend.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D1CDC7" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#696969"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#696969"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <RechartsTooltip 
                          formatter={(value: unknown) => formatCurrency(Number(value || 0))}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#CF4500" 
                          strokeWidth={2}
                          dot={{ fill: '#CF4500', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-dust-taupe border-2 border-dashed border-ink-black/10 rounded-xl">
                    No monthly data to display.
                  </div>
                )}
              </div>

              {/* Category Bar Chart */}
              <div className="bg-lifted-cream p-6 rounded-xl shadow-card">
                <h3 className="text-lg font-medium mb-6">Spending by Category (Bar)</h3>
                {analytics.chartData.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D1CDC7" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#696969"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#696969"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <RechartsTooltip 
                          formatter={(value: unknown) => formatCurrency(Number(value || 0))}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3860BE"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-dust-taupe border-2 border-dashed border-ink-black/10 rounded-xl">
                    No category data to display.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-lifted-cream rounded-xl shadow-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* List Toolbar */}
              <div className="p-4 border-b border-ink-black/10 bg-white/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 flex gap-2 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-gray" size={18} />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-ink-black/20 rounded-md focus:ring-2 focus:ring-signal-orange focus:border-signal-orange outline-none text-sm text-ink-black"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
                    className="px-3 py-2 bg-white border border-ink-black/20 rounded-md focus:ring-2 focus:ring-signal-orange outline-none text-sm text-ink-black"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => exportToCSV(filteredExpenses)}
                  disabled={filteredExpenses.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-black bg-white border border-ink-black/20 rounded-md hover:bg-lifted-cream disabled:opacity-50 transition-colors w-full sm:w-auto"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>

              {/* List */}
              <div className="overflow-x-auto">
                {filteredExpenses.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-gray uppercase bg-white/50 border-b border-ink-black/10">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Category</th>
                        <th className="px-6 py-4 font-medium text-right">Amount</th>
                        <th className="px-6 py-4 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-black/10">
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-white/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-granite">
                            {format(parseISO(expense.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 font-medium text-ink-black">
                            {expense.description}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-ink-black/5 text-ink-black">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-ink-black">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-link-blue hover:text-signal-orange transition-colors p-1"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="text-signal-orange hover:text-clay-brown transition-colors p-1"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-gray">
                    No expenses found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
