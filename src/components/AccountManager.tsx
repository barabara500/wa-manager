'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  QrCode,
  RefreshCw,
  Wifi,
  WifiOff,
  ScanLine,
  X,
  Phone,
} from 'lucide-react';
import { useWhatsAppStore, formatTimestamp, getStatusColor, getStatusLabel } from './WhatsAppStore';
import type { AccountStatus } from './WhatsAppStore';

export default function AccountManager() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    toggleAccountEnabled,
  } = useWhatsAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [scanningQR, setScanningQR] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAddAccount = () => {
    if (!newName.trim() || !newPhone.trim()) return;

    setScanningQR(true);

    // Simulate QR scanning process
    setTimeout(() => {
      addAccount({
        name: newName.trim(),
        phoneNumber: newPhone.trim(),
        status: 'connected',
        lastActive: new Date().toISOString(),
        enabled: true,
      });
      setScanningQR(false);
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
    }, 3000);
  };

  const handleReconnect = (id: string) => {
    updateAccount(id, { status: 'scanning' });
    setTimeout(() => {
      updateAccount(id, {
        status: 'connected',
        lastActive: new Date().toISOString(),
        enabled: true,
      });
    }, 2000);
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    setDeleteConfirm(null);
  };

  const getStatusIcon = (status: AccountStatus) => {
    switch (status) {
      case 'connected': return <Wifi size={16} />;
      case 'disconnected': return <WifiOff size={16} />;
      case 'scanning': return <ScanLine size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#E9EDEF]">Akun WhatsApp</h2>
          <p className="text-[#AEBAC1] mt-1">Kelola akun WhatsApp yang terhubung</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Tambah Akun
        </button>
      </div>

      {/* Account List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-[#111B21] border border-[#2A3942] rounded-xl p-5 hover:border-[#25D366]/30 transition-all duration-200 group"
          >
            {/* Status indicator bar */}
            <div
              className="h-1 w-full rounded-full mb-4"
              style={{ backgroundColor: `${getStatusColor(account.status)}40` }}
            />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${getStatusColor(account.status)}20` }}
                >
                  <Smartphone size={20} style={{ color: getStatusColor(account.status) }} />
                </div>
                <div>
                  <h3 className="text-[#E9EDEF] font-semibold text-sm">{account.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} className="text-[#AEBAC1]" />
                    <span className="text-xs text-[#AEBAC1]">{account.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${getStatusColor(account.status)}20`,
                  color: getStatusColor(account.status),
                }}
              >
                {getStatusIcon(account.status)}
                {getStatusLabel(account.status)}
              </div>
              {account.status === 'scanning' && (
                <div className="flex items-center gap-1 text-xs text-[#FBBC04]">
                  <RefreshCw size={12} className="animate-spin" />
                  Memindai...
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0B141A] rounded-lg p-2.5">
                <p className="text-xs text-[#AEBAC1]">Pesan Hari Ini</p>
                <p className="text-lg font-bold text-[#E9EDEF] mt-0.5">{account.messagesSentToday}</p>
              </div>
              <div className="bg-[#0B141A] rounded-lg p-2.5">
                <p className="text-xs text-[#AEBAC1]">Terakhir Aktif</p>
                <p className="text-xs font-medium text-[#E9EDEF] mt-1">
                  {formatTimestamp(account.lastActive)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-[#2A3942]">
              {/* Toggle */}
              <button
                onClick={() => toggleAccountEnabled(account.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: account.enabled ? '#25D36620' : '#2A3942',
                  color: account.enabled ? '#25D366' : '#AEBAC1',
                }}
              >
                {account.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {account.enabled ? 'Aktif' : 'Nonaktif'}
              </button>

              {account.status === 'disconnected' && (
                <button
                  onClick={() => handleReconnect(account.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#34B7F1]/15 text-[#34B7F1] hover:bg-[#34B7F1]/25 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Hubungkan
                </button>
              )}

              <div className="ml-auto">
                {deleteConfirm === account.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="px-2 py-1 rounded text-xs bg-[#EA4335] text-white font-medium cursor-pointer"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 rounded text-xs bg-[#2A3942] text-[#AEBAC1] font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(account.id)}
                    className="p-1.5 rounded-lg text-[#AEBAC1] hover:text-[#EA4335] hover:bg-[#EA4335]/15 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Account Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#111B21] border-2 border-dashed border-[#2A3942] rounded-xl p-5 hover:border-[#25D366]/50 transition-all duration-200 group flex flex-col items-center justify-center min-h-[200px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-3 group-hover:bg-[#25D366]/20 transition-colors">
            <Plus size={24} className="text-[#25D366]" />
          </div>
          <p className="text-sm text-[#AEBAC1] group-hover:text-[#E9EDEF] transition-colors">
            Tambah Akun Baru
          </p>
          <p className="text-xs text-[#667781] mt-1">Hubungkan via QR Code</p>
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111B21] border border-[#2A3942] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3942]">
              <h3 className="text-lg font-semibold text-[#E9EDEF]">Tambah Akun WhatsApp</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setScanningQR(false);
                  setNewName('');
                  setNewPhone('');
                }}
                className="p-1.5 rounded-lg text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-[#1F2C33] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {scanningQR ? (
                <div className="flex flex-col items-center space-y-4">
                  {/* QR Code Placeholder */}
                  <div className="relative">
                    <div className="w-48 h-48 bg-[#25D366]/10 border-2 border-[#25D366]/30 rounded-xl flex flex-col items-center justify-center animate-pulse">
                      <QrCode size={64} className="text-[#25D366] mb-2" />
                      <span className="text-sm text-[#25D366] font-medium">Scan QR Code</span>
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center">
                        <ScanLine size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#E9EDEF]">Menunggu pemindaian QR...</p>
                    <p className="text-xs text-[#AEBAC1] mt-1">Buka WhatsApp &gt; Perangkat Terhubung &gt; Hubungkan</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#FBBC04]">
                    <RefreshCw size={12} className="animate-spin" />
                    Memproses koneksi...
                  </div>
                </div>
              ) : (
                <>
                  {/* QR Code Placeholder Preview */}
                  <div className="flex justify-center">
                    <div className="w-48 h-48 bg-[#25D366]/10 border-2 border-dashed border-[#25D366]/30 rounded-xl flex flex-col items-center justify-center">
                      <QrCode size={64} className="text-[#25D366]/50 mb-2" />
                      <span className="text-sm text-[#AEBAC1]">QR Code akan muncul</span>
                    </div>
                  </div>

                  {/* Name input */}
                  <div>
                    <label className="block text-sm font-medium text-[#E9EDEF] mb-1.5">
                      Nama Akun
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: Akun Marketing"
                      className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none focus:border-[#25D366] transition-colors"
                    />
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="block text-sm font-medium text-[#E9EDEF] mb-1.5">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+62 812-xxxx-xxxx"
                      className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none focus:border-[#25D366] transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

            {!scanningQR && (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-[#2A3942]">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewName('');
                    setNewPhone('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#1F2C33] text-[#AEBAC1] rounded-lg font-medium text-sm hover:bg-[#2A3942] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddAccount}
                  disabled={!newName.trim() || !newPhone.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#25D366] text-white rounded-lg font-medium text-sm hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Hubungkan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
