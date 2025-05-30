export interface MonthlyIncome {
  month: string;
  income: number;
}

export interface IncomeData {
  monthlyData: MonthlyIncome[];
  totalIncome: number;
} 