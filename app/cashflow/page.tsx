'use client';

import { useState, useEffect, useMemo } from 'react';
import { CashflowEntry } from '../types/cashflow';
import { CashflowTable } from '../components/CashflowTable';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

// Generate array of months
const months = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

// Generate array of years (5 years back and 5 years forward)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

export default function CashflowPage() {
  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()].value);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CashflowEntry>({
    id: '',
    name: '',
    period: '',
    isKetengan: true,
    qty: 1,
    price: 0,
    type: 'income',
    notes: '',
    total: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    date: moment().format('YYYY-MM-DD'),
    category: 'Lain-Lain',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch data from API
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cashflow');
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter entries based on selected month, year, date range, and category
  const filteredEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      const [entryMonth, entryYear] = entry.period.split('/');
      return entryMonth === selectedMonth && entryYear === selectedYear;
    });
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }
    if (startDate || endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = moment(entry.date, 'DD/MM/YYYY');
        if (startDate && endDate) {
          return entryDate.isSameOrAfter(moment(startDate)) && entryDate.isSameOrBefore(moment(endDate));
        } else if (startDate) {
          return entryDate.isSameOrAfter(moment(startDate));
        } else if (endDate) {
          return entryDate.isSameOrBefore(moment(endDate));
        }
        return true;
      });
    }
    return filtered;
  }, [entries, selectedMonth, selectedYear, startDate, endDate, selectedCategory]);

  // Filter entries based on active tab
  const tabFilteredEntries = useMemo(() => {
    if (activeTab === 'all') return filteredEntries;
    return filteredEntries.filter(entry => entry.type === activeTab);
  }, [filteredEntries, activeTab]);

  // Calculate totals based on tabFilteredEntries (so it follows all filters)
  const totals = useMemo(() => {
    return tabFilteredEntries.reduce((acc, entry) => {
      const amount = entry.total;
      if (entry.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      acc.profit = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, profit: 0 });
  }, [tabFilteredEntries]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry: CashflowEntry = {
      ...formData,
      id: formData.id || uuidv4(),
      period: `${selectedMonth}/${selectedYear}`,
      total: formData.isKetengan ? formData.price : formData.qty * formData.price,
      createdAt: formData.id ? formData.createdAt : new Date(),
      updatedAt: new Date(),
    };

    try {
      setIsSubmitting(true);
      const method = formData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/cashflow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        await fetchEntries();
        setFormData({
          id: '',
          name: '',
          period: '',
          isKetengan: true,
          qty: 1,
          price: 0,
          type: 'income',
          notes: '',
          total: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          date: moment().format('YYYY-MM-DD'),
          category: 'Lain-Lain',
        });
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: CashflowEntry) => {
    console.log('entry', entry);
    console.log('date', moment(entry.date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    setFormData({
      ...entry,
      date: moment(entry.date, 'DD/MM/YYYY').format('YYYY-MM-DD'),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus entri ini?')) {
      try {
        const response = await fetch('/api/cashflow', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          setCurrentPage(1);
          await fetchEntries();
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      period: '',
      isKetengan: true,
      qty: 1,
      price: 0,
      type: 'income',
      notes: '',
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      date: moment().format('YYYY-MM-DD'),
      category: 'Lain-Lain',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-xs">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 text-xs">
        <div className="container mx-auto px-1 py-2 sm:py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 rounded-lg">
                  <svg 
                    className="w-5 h-5 text-blue-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
        <div>
                  <h1 className="text-base sm:text-sm font-bold text-gray-800">Cashflow Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Kelola pemasukan dan pengeluaran dengan mudah</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 text-xs"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 text-xs"
                  >
                    {years.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-gray-600 bg-gray-50 px-2 py-1 rounded-lg text-xs">
                  <span className="font-medium text-gray-700">{filteredEntries.length}</span> Entries
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-1 py-2 sm:py-2 md:py-3 text-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 text-xs">
            <div className="bg-green-50 p-2 rounded-lg border border-green-100">
              <div className="font-medium text-green-600 mb-0.5">Total Pemasukan</div>
              <div className="text-lg font-bold text-green-700">
                Rp {totals.income.toLocaleString()}
              </div>
            </div>
            <div className="bg-red-50 p-2 rounded-lg border border-red-100">
              <div className="font-medium text-red-600 mb-0.5">Total Pengeluaran</div>
              <div className="text-lg font-bold text-red-700">
                Rp {totals.expense.toLocaleString()}
              </div>
            </div>
            <div className={`p-2 rounded-lg border ${totals.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}> 
              <div className={`font-medium ${totals.profit >= 0 ? 'text-blue-600' : 'text-red-600'} mb-0.5`}>
                Total Profit
              </div>
              <div className={`text-lg font-bold ${totals.profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Rp {totals.profit.toLocaleString()}
              </div>
            </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2 lg:gap-3 text-xs">
            {showForm && (
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-base font-semibold text-gray-800 text-xs">Input Transaksi</h2>
                    <button
                      className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                    >
                      <svg 
                        className="w-4 h-4 text-gray-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-3">
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                          Tanggal
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-xs"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                          Nama
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Masukkan nama"
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 text-xs"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                          Jenis
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-xs"
                          disabled={isSubmitting}
                        >
                          <option value="income">Masuk</option>
                          <option value="expense">Keluar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                          Kategori
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-xs"
                          disabled={isSubmitting}
                        >
                          <option value="Gaji">Gaji</option>
                          <option value="Hasil">Hasil</option>
                          <option value="Belanja">Belanja</option>
                          <option value="Lain-Lain">Lain-Lain</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isKetengan"
                            checked={formData.isKetengan}
                            onChange={handleInputChange}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            disabled={isSubmitting}
                          />
                          <span className="text-sm font-medium text-gray-700 text-xs">Ketengan</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                            Qty
                          </label>
                          <input
                            type="number"
                            name="qty"
                            value={formData.qty}
                            onChange={handleInputChange}
                            onWheel={preventScroll}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs"
                            min="1"
                            required
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                            Harga
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            onWheel={preventScroll}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs"
                            min="0"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                          Total
                        </label>
                        <input
                          type="text"
                          value={`Rp ${(formData.isKetengan ? formData.price : formData.qty * formData.price).toLocaleString()}`}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 font-medium text-gray-700 text-xs"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-0.5 text-xs">
                          Catatan
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Masukkan catatan (opsional)"
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 text-xs"
                          rows={2}
                          disabled={isSubmitting}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <span>{formData.id ? 'Edit' : 'Tambah Data'}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className={`${showForm ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-800 text-xs">Filter</h2>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => {
                          setActiveTab('all');
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 text-sm rounded-md transition-colors text-xs ${
                          activeTab === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('income');
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 text-sm rounded-md transition-colors text-xs ${
                          activeTab === 'income'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-600 hover:text-green-600'
                        }`}
                      >
                        Pemasukan
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('expense');
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 text-sm rounded-md transition-colors text-xs ${
                          activeTab === 'expense'
                            ? 'bg-white text-red-600 shadow-sm'
                            : 'text-gray-600 hover:text-red-600'
                        }`}
                      >
                        Pengeluaran
                      </button>
                    </div>
                  </div>
                  {!showForm && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-xs"
                    >
                      <svg 
                        className="w-4 h-4 mr-1.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah
                    </button>
                  )}
                </div>

                <CashflowTable
                  entries={tabFilteredEntries}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRefresh={fetchEntries}
                  isLoading={isLoading}
                  setCurrentPage={setCurrentPage}
                  ITEMS_PER_PAGE={itemsPerPage}
                  currentPage={currentPage}
                  setItemsPerPage={setItemsPerPage}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 