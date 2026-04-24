export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: number;
}
