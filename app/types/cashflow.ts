export interface CashflowEntry {
  id: string;
  name: string;
  period: string;
  isKetengan: boolean;
  qty: number;
  price: number;
  type: 'income' | 'expense';
  notes: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  date: string;
  category: string;
}

export interface CashflowFormData {
  name: string;
  period: string;
  date: string;
  category: string;
  isKetengan: boolean;
  qty: number;
  price: number;
  type: 'in' | 'out';
  notes: string;
} 