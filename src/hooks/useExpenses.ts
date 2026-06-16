'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem('expense-tracker-data');
      return stored ? (JSON.parse(stored) as Expense[]) : [];
    } catch (error) {
      console.error(`Failed to parse expenses from local storage ${error}`);
      return [];
    }
  });

  const isLoaded = true;

  useEffect(() => {
    localStorage.setItem('expense-tracker-data', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === updatedExpense.id ? updatedExpense : exp))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
