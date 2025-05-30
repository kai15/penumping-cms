'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import moment from 'moment';

const months = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Agu' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Okt' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Des' }
];

const categories = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Gaji', label: 'Gaji' },
  { value: 'Hasil', label: 'Hasil' },
  { value: 'Belanja', label: 'Belanja' },
  { value: 'Lain-Lain', label: 'Lain-Lain' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

// Helper: get category label
const getCategoryLabel = (val: string) => categories.find(c => c.value === val)?.label || val;

const CATEGORY_COLORS = ['#6366F1', '#10B981', '#F59E42', '#EF4444', '#A21CAF'];
const INCOME_COLOR = '#10B981';
const EXPENSE_COLOR = '#EF4444';

export default function Dashboard() {
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()].value);
  const [chartYear, setChartYear] = useState(currentYear.toString());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cashflow');
      const data = await res.json();
      setCashflow(data);
    } catch (e) {
      setCashflow([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Data per bulan untuk chart
  const chartData = useMemo(() => {
    return months.map((m) => {
      const month = m.value;
      const year = chartYear;
      let income = 0;
      let expense = 0;
      cashflow.forEach(entry => {
        const [entryMonth, entryYear] = entry.period.split('/');
        if (entryMonth === month && entryYear === year) {
          if (selectedCategory === 'all' || entry.category === selectedCategory) {
            if (entry.type === 'income') income += entry.total;
            else if (entry.type === 'expense') expense += entry.total;
          }
        }
      });
      return {
        month: m.label,
        income,
        expense,
        profit: income - expense
      };
    });
  }, [cashflow, chartYear, selectedCategory]);

  // Data untuk card (total bulan & tahun terpilih)
  const summary = useMemo(() => {
    let income = 0, expense = 0;
    cashflow.forEach(entry => {
      const [entryMonth, entryYear] = entry.period.split('/');
      if (entryMonth === selectedMonth && entryYear === selectedYear) {
        if (selectedCategory === 'all' || entry.category === selectedCategory) {
          if (entry.type === 'income') income += entry.total;
          else if (entry.type === 'expense') expense += entry.total;
        }
      }
    });
    return {
      income,
      expense,
      profit: income - expense
    };
  }, [cashflow, selectedMonth, selectedYear, selectedCategory]);

  // Data untuk horizontal barchart by category (filter: bulan, tahun)
  const categoryBarData = useMemo(() => {
    // Tampilkan semua kategori, meski 0
    return categories.filter(c => c.value !== 'all').map(cat => {
      let income = 0, expense = 0;
      cashflow.forEach(entry => {
        const [entryMonth, entryYear] = entry.period.split('/');
        if (entryMonth === selectedMonth && entryYear === selectedYear && entry.category === cat.value) {
          if (entry.type === 'income') income += entry.total;
          else if (entry.type === 'expense') expense += entry.total;
        }
      });
      return {
        category: cat.label,
        income,
        expense,
        profit: income - expense
      };
    });
  }, [cashflow, selectedMonth, selectedYear]);

  // Data untuk pie chart kategori (bulan, tahun)
  const categoryPieData = useMemo(() => {
    return categories.filter(c => c.value !== 'all').map((cat, idx) => {
      let total = 0;
      cashflow.forEach(entry => {
        const [entryMonth, entryYear] = entry.period.split('/');
        if (entryMonth === selectedMonth && entryYear === selectedYear && entry.category === cat.value) {
          total += entry.total;
        }
      });
      return {
        name: cat.label,
        value: total,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      };
    }).filter(d => d.value > 0);
  }, [cashflow, selectedMonth, selectedYear]);

  // Data untuk pie chart income vs expense (bulan, tahun)
  const incomeExpensePieData = useMemo(() => {
    let income = 0, expense = 0;
    cashflow.forEach(entry => {
      const [entryMonth, entryYear] = entry.period.split('/');
      if (entryMonth === selectedMonth && entryYear === selectedYear) {
        if (entry.type === 'income') income += entry.total;
        else if (entry.type === 'expense') expense += entry.total;
      }
    });
    return [
      { name: 'Income', value: income, color: INCOME_COLOR },
      { name: 'Expense', value: expense, color: EXPENSE_COLOR }
    ].filter(d => d.value > 0);
  }, [cashflow, selectedMonth, selectedYear]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm text-xs">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-green-600">Income: Rp {payload[0].value.toLocaleString()}</p>
          <p className="text-red-600">Expense: Rp {payload[1].value.toLocaleString()}</p>
          <p className="text-blue-600">Profit: Rp {payload[2].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Financial Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of your financial performance</p>
          </div>
        </div>

        {/* Summary Cards with Month & Year Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Monthly Summary</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                {years.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
                <div className="p-2 bg-green-50 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">Rp {summary.income.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                {selectedCategory !== 'all' && ` • ${categories.find(c => c.value === selectedCategory)?.label}`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Expense</h3>
                <div className="p-2 bg-red-50 rounded-lg">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">Rp {summary.expense.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                {selectedCategory !== 'all' && ` • ${categories.find(c => c.value === selectedCategory)?.label}`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
                <div className={`p-2 rounded-lg ${summary.profit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <svg className={`w-4 h-4 ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Rp {summary.profit.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                {selectedCategory !== 'all' && ` • ${categories.find(c => c.value === selectedCategory)?.label}`}
              </p>
            </div>
          </div>
          {/* Pie Chart Area: 2 Cards Side by Side */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Pie Chart by Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center">
              <h2 className="text-base font-semibold text-gray-800 mb-2">Distribusi Kategori</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: Rp ${Number(value).toLocaleString()}`}
                    isAnimationActive={true}
                  >
                    {categoryPieData.map((entry, idx) => (
                      <Cell key={`cell-cat-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Card 2: Pie Chart Income vs Expense */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center">
              <h2 className="text-base font-semibold text-gray-800 mb-2">Income vs Expense</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={incomeExpensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: Rp ${Number(value).toLocaleString()}`}
                    isAnimationActive={true}
                  >
                    {incomeExpensePieData.map((entry, idx) => (
                      <Cell key={`cell-inc-exp-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart with Year Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Annual Financial Overview</h2>
            <div className="flex items-center gap-3">
              <select
                value={chartYear}
                onChange={e => setChartYear(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                {years.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10B981">
                    <LabelList dataKey="income" position="top" formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  </Bar>
                  <Bar dataKey="expense" name="Expense" fill="#EF4444">
                    <LabelList dataKey="expense" position="top" formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  </Bar>
                  <Bar dataKey="profit" name="Profit" fill="#6366F1">
                    <LabelList dataKey="profit" position="top" formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2}>
                    <LabelList dataKey="income" position="top" formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  </Line>
                  <Line type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" strokeWidth={2}>
                    <LabelList dataKey="expense" position="top" formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  </Line>
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#6366F1" strokeWidth={2}>
                    <LabelList dataKey="profit" position="top" formatter={(v: number) => `Rp ${Number(v).toLocaleString()}`} />
                  </Line>
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 