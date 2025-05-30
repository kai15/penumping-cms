'use client';

import React, { useState } from 'react';
import { CashflowEntry } from '../types/cashflow';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CashflowTableProps {
  entries: CashflowEntry[];
  onEdit: (entry: CashflowEntry) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  setCurrentPage: (page: number) => void;
  ITEMS_PER_PAGE: number;
  currentPage: number;
  setItemsPerPage: (size: number) => void;
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

type SortField = 'type' | 'price' | 'total' | 'qty' | 'date' | 'category';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: -1, label: 'Semua' }
];

const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Gaji', label: 'Gaji' },
  { value: 'Hasil', label: 'Hasil' },
  { value: 'Belanja', label: 'Belanja' },
  { value: 'Lain-Lain', label: 'Lain-Lain' },
];

export function CashflowTable({ 
  entries, 
  onEdit, 
  onDelete, 
  onRefresh, 
  isLoading = false, 
  setCurrentPage, 
  ITEMS_PER_PAGE = 25, 
  currentPage = 1,
  setItemsPerPage,
  dateRange,
  setDateRange,
  selectedCategory,
  setSelectedCategory
}: CashflowTableProps) {
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [startDate, endDate] = dateRange;

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Filter entries by category before sorting and pagination
  const categoryFilteredEntries = selectedCategory === 'all'
    ? entries
    : entries.filter(entry => entry.category === selectedCategory);

  const sortedEntries = [...categoryFilteredEntries].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'total':
        comparison = a.total - b.total;
        break;
      case 'qty':
        comparison = a.qty - b.qty;
        break;
      case 'date':
        comparison = a.date.localeCompare(b.date);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      default:
        comparison = 0;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalPages = ITEMS_PER_PAGE === -1 ? 1 : Math.ceil(sortedEntries.length / ITEMS_PER_PAGE);
  const startIndex = ITEMS_PER_PAGE === -1 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEntries = ITEMS_PER_PAGE === -1 
    ? sortedEntries 
    : sortedEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <div className="mt-2 text-gray-500">Memuat data...</div>
      </div>
    );
  }

//   if (entries.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <div className="text-gray-500">Tidak ada data yang tersedia</div>
//       </div>
//     );
//   }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4 text-xs">
        <div className="flex-1">
          <label className="block font-medium text-gray-700 mb-1 text-xs">Tanggal</label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              if (Array.isArray(update)) {
                setDateRange(update as [Date | null, Date | null]);
              } else {
                setDateRange([update, null]);
              }
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 text-xs"
            placeholderText="Pilih rentang tanggal"
            dateFormat="dd/MM/yyyy"
            isClearable={true}
          />
        </div>
        <div className="flex-1">
          <label className="block font-medium text-gray-700 mb-1 text-xs">Kategori</label>
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-xs"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block font-medium text-gray-700 mb-1 text-xs">Tampilkan</label>
            <select
              value={ITEMS_PER_PAGE}
              onChange={handlePageSizeChange}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 text-xs"
            >
              {PAGE_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs"
          >
            <svg 
              className="w-4 h-4 mr-1.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-xs">
          <div className="text-gray-500">Tidak ada data yang tersedia</div>
        </div>
      ) : (

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider w-12 text-xs">#</th>
              <th 
                className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Tanggal
                  <SortIcon field="date" />
                </div>
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Nama</th>
              <th 
                className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Jenis
                  <SortIcon field="type" />
                </div>
              </th>
              <th 
                className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Kategori
                  <SortIcon field="category" />
                </div>
              </th>
              <th 
                className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => handleSort('qty')}
              >
                <div className="flex items-center">
                  Qty
                  <SortIcon field="qty" />
                </div>
              </th>
              <th 
                className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">
                  Harga
                  <SortIcon field="price" />
                </div>
              </th>
              <th 
                className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center">
                  Total
                  <SortIcon field="total" />
                </div>
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Catatan</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs">
            {paginatedEntries.map((entry, index) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-2 py-1 text-gray-900 text-center">{startIndex + index + 1}</td>
                <td className="px-2 py-1 text-gray-900">{entry.date}</td>
                <td className="px-2 py-1 text-gray-900">{entry.name}</td>
                <td className="px-2 py-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    entry.type === 'income' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.type === 'income' ? 'Masuk' : 'Keluar'}
                  </span>
                </td>
                <td className="px-2 py-1 text-gray-900">{entry.category}</td>
                <td className="px-2 py-1 text-gray-900">
                  {entry.qty}
                </td>
                <td className="px-2 py-1 text-gray-900">
                  Rp {entry.price.toLocaleString()}
                </td>
                <td className="px-2 py-1 font-medium">
                  <span className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    Rp {entry.total.toLocaleString()}
                  </span>
                </td>
                <td className="px-2 py-1 text-gray-500">
                  {entry.notes || '-'}
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    <button
                      title="Edit"
                      onClick={() => onEdit(entry)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      title="Hapus"
                      onClick={() => onDelete(entry.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-[11px]">
          <div className="text-gray-700">
            Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, sortedEntries.length)} dari {sortedEntries.length} data
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded-md font-medium ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-2 py-1 rounded-md font-medium ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded-md font-medium ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 