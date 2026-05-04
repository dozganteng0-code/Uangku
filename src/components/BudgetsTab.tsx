import React from "react";
import { FinanceRecord } from "../types";
import { parseCategory } from "../lib/utils";

export const BudgetsTab = ({
  budgets,
  setBudgets,
  financeRecords,
  categories,
  trackedCategories,
  setTrackedCategories,
}: {
  budgets: Record<string, { amount: number; period: 'monthly' | 'yearly' }>;
  setBudgets: React.Dispatch<React.SetStateAction<Record<string, { amount: number; period: 'monthly' | 'yearly' }>>>;
  financeRecords: FinanceRecord[];
  categories: string[];
  trackedCategories: string[];
  setTrackedCategories: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const expenseCategories = categories
    .map(parseCategory)
    .filter((c) => c.type === "expense" || c.type === "all");

  const untrackedCategories = expenseCategories.filter(
    (c) => !trackedCategories.includes(c.raw),
  );

  const getSpent = (category: string, period: 'monthly' | 'yearly') => {
    const now = new Date();
    return financeRecords
      .filter((r) => {
        if (r.category !== category || r.type !== "expense") return false;
        const date = new Date(r.date);
        if (period === 'monthly') {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        } else {
          return date.getFullYear() === now.getFullYear();
        }
      })
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const handleBudgetChange = (category: string, field: 'amount' | 'period', value: string | 'monthly' | 'yearly') => {
    setBudgets((prev) => {
      const current = prev[category] || { amount: 0, period: 'monthly' };
      return { ...prev, [category]: { ...current, [field]: field === 'amount' ? parseFloat(value as string) || 0 : value } };
    });
  };

  const addTrackedCategory = (category: string) => {
    if (!trackedCategories.includes(category)) {
      setTrackedCategories((prev) => [...prev, category]);
      setBudgets(prev => ({...prev, [category]: { amount: 0, period: 'monthly' }}));
    }
  };

  const removeTrackedCategory = (category: string) => {
    setTrackedCategories((prev) => prev.filter((c) => c !== category));
    setBudgets((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-2xl font-black text-slate-800">Budgeting</h2>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="block mb-2 font-bold text-slate-700">Tambahkan Kategori ke Budget</label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              addTrackedCategory(e.target.value);
              e.target.value = "";
            }
          }}
          className="w-full p-2 border rounded-xl"
        >
          <option value="">Pilih kategori</option>
          {untrackedCategories.map((c) => (
            <option key={c.raw} value={c.raw}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {trackedCategories.map((raw) => {
          const category = expenseCategories.find((c) => c.raw === raw);
          if (!category) return null;
          
          const budget = budgets[category.raw] || { amount: 0, period: 'monthly' };
          const spent = getSpent(category.raw, budget.period);
          const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
          
          return (
            <div key={category.raw} className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-slate-700">{category.name}</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeTrackedCategory(category.raw)} className="text-xs text-rose-500 hover:text-rose-700">Hapus</button>
                  <span className="text-xs text-rose-500">Rp {spent.toLocaleString()} / </span>
                  <input
                    type="number"
                    value={budget.amount === 0 ? "" : budget.amount}
                    onChange={(e) => handleBudgetChange(category.raw, 'amount', e.target.value)}
                    placeholder="Limit"
                    className="w-20 text-right p-1 border rounded text-xs"
                  />
                  <select
                    value={budget.period}
                    onChange={(e) => handleBudgetChange(category.raw, 'period', e.target.value as 'monthly' | 'yearly')}
                    className="text-xs border rounded p-1"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${percentage >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(0)}% terpakai</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
