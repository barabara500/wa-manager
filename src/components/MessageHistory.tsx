'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  MessageSquare,
  X,
  CalendarDays,
  Smartphone,
} from 'lucide-react';
import { useWhatsAppStore, formatTimestamp, getStatusColor, getStatusLabel, type MessageStatus } from './WhatsAppStore';

const ITEMS_PER_PAGE = 8;

export default function MessageHistory() {
  const { messages, accounts } = useWhatsAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<MessageStatus | 'all'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filtered messages
  const filteredMessages = useMemo(() => {
    let result = [...messages];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.recipientPhone.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        m.accountName.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(m => m.status === filterStatus);
    }

    // Filter by account
    if (filterAccount !== 'all') {
      result = result.filter(m => m.accountId === filterAccount);
    }

    // Filter by date range
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(m => new Date(m.timestamp) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(m => new Date(m.timestamp) <= to);
    }

    // Sort
    result.sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? -diff : diff;
    });

    return result;
  }, [messages, searchQuery, filterStatus, filterAccount, filterDateFrom, filterDateTo, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterAccount('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = ['Waktu', 'Akun', 'Nomor Tujuan', 'Pesan', 'Status', 'Error'];
    const rows = filteredMessages.map(m => [
      new Date(m.timestamp).toLocaleString('id-ID'),
      m.accountName,
      m.recipientPhone,
      `"${m.message.replace(/"/g, '""')}"`,
      getStatusLabel(m.status),
      m.errorMessage || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-pesan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} className="text-[#25D366]" />;
      case 'failed': return <XCircle size={14} className="text-[#EA4335]" />;
      case 'pending': return <Clock size={14} className="text-[#FBBC04]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#E9EDEF]">Riwayat Pesan</h2>
          <p className="text-[#AEBAC1] mt-1">{filteredMessages.length} pesan ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-[#1F2C33] hover:bg-[#2A3942] text-[#AEBAC1] rounded-lg text-sm transition-colors cursor-pointer"
          >
            <Download size={14} />
            Ekspor CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              showFilters ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-[#1F2C33] hover:bg-[#2A3942] text-[#AEBAC1]'
            }`}
          >
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="Cari nomor, pesan, atau akun..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#111B21] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none focus:border-[#25D366] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667781] hover:text-[#E9EDEF] cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-xs text-[#AEBAC1] mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as MessageStatus | 'all'); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366]"
              >
                <option value="all">Semua Status</option>
                <option value="success">Berhasil</option>
                <option value="failed">Gagal</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Account filter */}
            <div>
              <label className="block text-xs text-[#AEBAC1] mb-1.5">
                <Smartphone size={10} className="inline mr-1" />Akun
              </label>
              <select
                value={filterAccount}
                onChange={(e) => { setFilterAccount(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366]"
              >
                <option value="all">Semua Akun</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs text-[#AEBAC1] mb-1.5">
                <CalendarDays size={10} className="inline mr-1" />Dari
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366]"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs text-[#AEBAC1] mb-1.5">
                <CalendarDays size={10} className="inline mr-1" />Sampai
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A3942]">
            <button
              onClick={clearFilters}
              className="text-xs text-[#AEBAC1] hover:text-[#E9EDEF] transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-[#25D366] hover:text-[#128C7E] transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Messages Table */}
      <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A3942]">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#25D366]" />
            <h3 className="text-sm font-semibold text-[#E9EDEF]">Daftar Pesan</h3>
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-xs text-[#AEBAC1] hover:text-[#E9EDEF] transition-colors cursor-pointer"
          >
            <ArrowUpDown size={12} />
            {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
          </button>
        </div>

        {/* Table content */}
        {paginatedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageSquare size={40} className="text-[#667781] mb-3" />
            <p className="text-sm text-[#AEBAC1]">Tidak ada pesan ditemukan</p>
            <p className="text-xs text-[#667781] mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3942]">
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#AEBAC1] uppercase tracking-wider">Waktu</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#AEBAC1] uppercase tracking-wider">Akun</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#AEBAC1] uppercase tracking-wider">Nomor Tujuan</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#AEBAC1] uppercase tracking-wider">Pesan</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#AEBAC1] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMessages.map((msg) => (
                    <tr key={msg.id} className="border-b border-[#2A3942]/50 hover:bg-[#1F2C33]/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-xs text-[#AEBAC1] whitespace-nowrap">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-[#E9EDEF] font-medium">{msg.accountName}</span>
                        <br />
                        <span className="text-[10px] text-[#667781]">{msg.accountPhone}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-[#E9EDEF] font-mono">{msg.recipientPhone}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-[#AEBAC1] line-clamp-2 max-w-[200px]">{msg.message}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(msg.status)}
                          <span
                            className="text-xs font-medium"
                            style={{ color: getStatusColor(msg.status) }}
                          >
                            {getStatusLabel(msg.status)}
                          </span>
                        </div>
                        {msg.errorMessage && (
                          <p className="text-[10px] text-[#EA4335] mt-1 max-w-[150px] truncate">
                            {msg.errorMessage}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#2A3942]/50">
              {paginatedMessages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-[#1F2C33]/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(msg.status)}
                      <span className="text-xs font-mono text-[#E9EDEF]">{msg.recipientPhone}</span>
                    </div>
                    <span className="text-[10px] text-[#667781] whitespace-nowrap ml-2">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[#AEBAC1] line-clamp-2 mb-2">{msg.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#667781]">via {msg.accountName}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${getStatusColor(msg.status)}20`,
                        color: getStatusColor(msg.status),
                      }}
                    >
                      {getStatusLabel(msg.status)}
                    </span>
                  </div>
                  {msg.errorMessage && (
                    <p className="text-[10px] text-[#EA4335] mt-1">{msg.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#2A3942]">
                <span className="text-xs text-[#AEBAC1]">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-[#1F2C33] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <ChevronLeft size={14} className="-ml-2" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-[#1F2C33] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 rounded text-xs font-medium transition-colors cursor-pointer ${
                            page === currentPage
                              ? 'bg-[#25D366] text-white'
                              : 'text-[#AEBAC1] hover:bg-[#1F2C33]'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-[#1F2C33] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-[#1F2C33] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                    <ChevronRight size={14} className="-ml-2" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
