'use client';

import React, { useState } from 'react';
import { WhatsAppProvider, useWhatsAppStore } from '@/components/WhatsAppStore';
import Sidebar, { type ActiveTab } from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import AccountManager from '@/components/AccountManager';
import BulkMessenger from '@/components/BulkMessenger';
import MessageHistory from '@/components/MessageHistory';
import Settings from '@/components/Settings';
import { MessageCircle } from 'lucide-react';

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B141A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center animate-pulse">
          <MessageCircle size={32} className="text-[#25D366]" />
        </div>
        <p className="text-[#AEBAC1] text-sm animate-pulse">Memuat WA Manager...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { mounted } = useWhatsAppStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading skeleton until client-side hydration is complete
  if (!mounted) {
    return <LoadingSkeleton />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'accounts':
        return <AccountManager />;
      case 'bulk':
        return <BulkMessenger />;
      case 'history':
        return <MessageHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B141A]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 min-h-screen">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <WhatsAppProvider>
      <AppContent />
    </WhatsAppProvider>
  );
}
