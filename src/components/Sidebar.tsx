'use client';

import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  Send,
  History,
  Settings as SettingsIcon,
  MessageCircle,
  Menu,
  X,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'accounts' | 'bulk' | 'history' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Akun WhatsApp', icon: Smartphone },
  { id: 'bulk', label: 'Kirim Pesan Massal', icon: Send },
  { id: 'history', label: 'Riwayat Pesan', icon: History },
  { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#1F2C33] text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen w-64
          bg-[#111B21] border-r border-[#2A3942]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#2A3942]">
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[#E9EDEF] font-bold text-base truncate">WA Manager</h1>
            <p className="text-[#AEBAC1] text-xs truncate">Multi-Account Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-[#25D366]/15 text-[#25D366] shadow-sm'
                    : 'text-[#AEBAC1] hover:bg-[#1F2C33] hover:text-[#E9EDEF]'
                  }
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#2A3942]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-[#AEBAC1] text-xs">Sistem Aktif</span>
          </div>
        </div>
      </aside>
    </>
  );
}
