'use client';

import React from 'react';
import {
  Smartphone,
  Send,
  Clock,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useWhatsAppStore, formatTimestamp, getStatusColor } from './WhatsAppStore';
import type { ActiveTab } from './Sidebar';

interface DashboardProps {
  onNavigate: (tab: ActiveTab) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const {
    accounts,
    messages,
    getConnectedAccounts,
    getMessagesSentToday,
    getPendingMessages,
    getFailedMessages,
  } = useWhatsAppStore();

  const connectedAccounts = getConnectedAccounts();
  const sentToday = getMessagesSentToday();
  const pendingMessages = getPendingMessages();
  const failedMessages = getFailedMessages();

  const stats = [
    {
      label: 'Total Akun Terhubung',
      value: connectedAccounts.length,
      total: accounts.length,
      icon: Smartphone,
      color: '#25D366',
      bgColor: '#25D366/15',
    },
    {
      label: 'Pesan Terkirim Hari Ini',
      value: sentToday,
      icon: Send,
      color: '#00A884',
      bgColor: '#00A884/15',
    },
    {
      label: 'Pesan Pending',
      value: pendingMessages,
      icon: Clock,
      color: '#FBBC04',
      bgColor: '#FBBC04/15',
    },
    {
      label: 'Pesan Gagal',
      value: failedMessages,
      icon: AlertTriangle,
      color: '#EA4335',
      bgColor: '#EA4335/15',
    },
  ];

  const recentMessages = messages.slice(0, 8);

  const quickActions = [
    {
      label: 'Kirim Pesan Massal',
      description: 'Kirim pesan ke banyak kontak sekaligus',
      icon: Send,
      tab: 'bulk' as ActiveTab,
      color: '#25D366',
    },
    {
      label: 'Kelola Akun',
      description: 'Tambah atau kelola akun WhatsApp',
      icon: Smartphone,
      tab: 'accounts' as ActiveTab,
      color: '#128C7E',
    },
    {
      label: 'Lihat Riwayat',
      description: 'Periksa status pengiriman pesan',
      icon: MessageCircle,
      tab: 'history' as ActiveTab,
      color: '#00A884',
    },
    {
      label: 'Pengaturan',
      description: 'Konfigurasi delay dan template',
      icon: Zap,
      tab: 'settings' as ActiveTab,
      color: '#34B7F1',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#E9EDEF]">Dashboard</h2>
        <p className="text-[#AEBAC1] mt-1">Ringkasan aktivitas WhatsApp Manager</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#111B21] border border-[#2A3942] rounded-xl p-4 hover:border-[#25D366]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[#25D366]/5"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                {stat.total !== undefined && (
                  <span className="text-[#AEBAC1] text-xs">
                    dari {stat.total} akun
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-[#E9EDEF]">{stat.value}</p>
                <p className="text-xs text-[#AEBAC1] mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#111B21] border border-[#2A3942] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942]">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#25D366]" />
              <h3 className="text-sm font-semibold text-[#E9EDEF]">Aktivitas Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-[#25D366] hover:text-[#128C7E] transition-colors flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 px-5 py-3 border-b border-[#2A3942]/50 last:border-b-0 hover:bg-[#1F2C33]/50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(msg.status) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#E9EDEF] font-medium truncate">
                      {msg.recipientPhone}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${getStatusColor(msg.status)}20`,
                        color: getStatusColor(msg.status),
                      }}
                    >
                      {msg.status === 'success' ? 'Berhasil' : msg.status === 'failed' ? 'Gagal' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-[#AEBAC1] mt-0.5 truncate">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[#667781]">
                      via {msg.accountName}
                    </span>
                    <span className="text-[10px] text-[#667781]">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111B21] border border-[#2A3942] rounded-xl">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A3942]">
            <Zap size={18} className="text-[#FBBC04]" />
            <h3 className="text-sm font-semibold text-[#E9EDEF]">Aksi Cepat</h3>
          </div>
          <div className="p-4 space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.tab)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0B141A] border border-[#2A3942] hover:border-[#25D366]/30 transition-all duration-200 hover:shadow-md cursor-pointer group text-left"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon size={16} style={{ color: action.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#E9EDEF]">{action.label}</p>
                    <p className="text-xs text-[#AEBAC1] mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight size={14} className="text-[#667781] group-hover:text-[#25D366] transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Account Status Overview */}
      <div className="bg-[#111B21] border border-[#2A3942] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-[#25D366]" />
            <h3 className="text-sm font-semibold text-[#E9EDEF]">Status Akun</h3>
          </div>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs text-[#25D366] hover:text-[#128C7E] transition-colors flex items-center gap-1"
          >
            Kelola <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#0B141A] border border-[#2A3942]"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: getStatusColor(account.status),
                  boxShadow: account.status === 'connected' ? `0 0 8px ${getStatusColor(account.status)}60` : 'none',
                }}
              />
              <div className="min-w-0">
                <p className="text-sm text-[#E9EDEF] font-medium truncate">{account.name}</p>
                <p className="text-xs text-[#AEBAC1] truncate">{account.phoneNumber}</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${getStatusColor(account.status)}20`,
                    color: getStatusColor(account.status),
                  }}
                >
                  {account.status === 'connected' ? 'Aktif' : account.status === 'scanning' ? 'Scan' : 'Off'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
