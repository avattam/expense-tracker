'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('expense-tracker-data');
    if (stored) {
      try {
        setExpenses(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse expenses from local storage');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever expenses change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('expense-tracker-data', JSON.stringify(expenses));
    }
  }, [expenses, isLoaded]);

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
