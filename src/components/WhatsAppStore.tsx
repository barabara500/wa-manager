'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ===== TYPES =====
export type AccountStatus = 'connected' | 'disconnected' | 'scanning';
export type MessageStatus = 'success' | 'failed' | 'pending';
export type SendMode = 'single' | 'rotation';
export type SendJobStatus = 'idle' | 'sending' | 'paused' | 'completed' | 'stopped';

export interface WhatsAppAccount {
  id: string;
  name: string;
  phoneNumber: string;
  status: AccountStatus;
  lastActive: string;
  enabled: boolean;
  messagesSentToday: number;
  avatar?: string;
}

export interface MessageRecord {
  id: string;
  accountId: string;
  accountName: string;
  accountPhone: string;
  recipientPhone: string;
  message: string;
  status: MessageStatus;
  timestamp: string;
  errorMessage?: string;
  retryCount: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface AppSettings {
  defaultMinDelay: number;
  defaultMaxDelay: number;
  messagesPerAccount: number;
  maxRetryAttempts: number;
}

export interface SendLogEntry {
  id: string;
  accountId: string;
  accountPhone: string;
  recipientPhone: string;
  status: MessageStatus;
  timestamp: string;
  errorMessage?: string;
}

export interface SendingState {
  status: SendJobStatus;
  total: number;
  sent: number;
  success: number;
  failed: number;
  currentRecipient: string;
  currentAccount: string;
  logs: SendLogEntry[];
}

// ===== DEMO DATA =====
const generateId = () => Math.random().toString(36).substring(2, 11);

// Use fixed dates to avoid hydration mismatch between server and client
const today = '2026-04-14';
const yesterday = '2026-04-13';
const twoDaysAgo = '2026-04-12';

const initialAccounts: WhatsAppAccount[] = [
  {
    id: 'acc-001',
    name: 'Akun Utama',
    phoneNumber: '+62 812-3456-7890',
    status: 'connected',
    lastActive: '2026-04-14T11:30:00.000Z',
    enabled: true,
    messagesSentToday: 47,
  },
  {
    id: 'acc-002',
    name: 'Akun Marketing',
    phoneNumber: '+62 813-9876-5432',
    status: 'connected',
    lastActive: '2026-04-14T11:00:00.000Z',
    enabled: true,
    messagesSentToday: 23,
  },
  {
    id: 'acc-003',
    name: 'Akun Support',
    phoneNumber: '+62 857-1234-5678',
    status: 'disconnected',
    lastActive: '2026-04-14T09:30:00.000Z',
    enabled: false,
    messagesSentToday: 0,
  },
];

const sampleMessages: string[] = [
  'Halo {nama}, kami ingin menginformasikan promo spesial bulan ini! Dapatkan diskon hingga 50% untuk semua produk.',
  'Yth. Bapak/Ibu, terima kasih telah menjadi pelanggan setia kami. Kami ingin memberikan penawaran eksklusif untuk Anda.',
  'Assalamualaikum, jangan lewatkan event tahunan kami yang akan datang! Gratis untuk pelanggan terpilih.',
  'Halo! Kami baru saja meluncurkan produk terbaru. Yuk cek sekarang di website kami!',
  'Promo terbatas! Beli 2 gratis 1. Berlaku hingga akhir bulan ini.',
];

const recipientPhones = [
  '+62 821-1111-2222',
  '+62 822-3333-4444',
  '+62 823-5555-6666',
  '+62 824-7777-8888',
  '+62 825-9999-0000',
  '+62 826-1212-3434',
  '+62 827-5656-7878',
  '+62 828-9090-1234',
  '+62 829-3456-7890',
  '+62 838-2345-6789',
  '+62 851-1234-5678',
  '+62 852-2345-6789',
  '+62 853-3456-7890',
  '+62 854-4567-8901',
  '+62 855-5678-9012',
  '+62 856-6789-0123',
  '+62 857-7890-1234',
  '+62 858-8901-2345',
  '+62 859-9012-3456',
  '+62 813-1111-2222',
  '+62 814-3333-4444',
  '+62 815-5555-6666',
  '+62 816-7777-8888',
  '+62 817-9999-0000',
  '+62 818-1212-3434',
];

// Deterministic seed-based pseudo-random to avoid hydration mismatch
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateHistoryMessages(): MessageRecord[] {
  const messages: MessageRecord[] = [];
  const statuses: MessageStatus[] = ['success', 'success', 'success', 'success', 'failed', 'pending'];

  for (let i = 0; i < 25; i++) {
    const account = initialAccounts[i % 3];
    const status = statuses[Math.floor(seededRandom(i * 7 + 1) * statuses.length)];
    const dayOffset = Math.floor(seededRandom(i * 7 + 2) * 3);
    const baseDate = new Date(2026, 3, 14 - dayOffset); // April 14, 2026 - dayOffset
    const hour = Math.floor(seededRandom(i * 7 + 3) * 12) + 8;
    const minute = Math.floor(seededRandom(i * 7 + 4) * 60);

    baseDate.setHours(hour, minute, 0, 0);

    messages.push({
      id: `msg-${String(i + 1).padStart(3, '0')}`,
      accountId: account.id,
      accountName: account.name,
      accountPhone: account.phoneNumber,
      recipientPhone: recipientPhones[i % recipientPhones.length],
      message: sampleMessages[i % sampleMessages.length],
      status,
      timestamp: baseDate.toISOString(),
      errorMessage: status === 'failed' ? 'Gagal mengirim: nomor tidak terdaftar di WhatsApp' : undefined,
      retryCount: status === 'failed' ? 2 : 0,
    });
  }

  return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Pre-compute deterministic initial messages (no Math.random, no new Date at module scope)
const initialMessages = generateHistoryMessages();

const initialSettings: AppSettings = {
  defaultMinDelay: 5,
  defaultMaxDelay: 15,
  messagesPerAccount: 10,
  maxRetryAttempts: 3,
};

const initialTemplates: MessageTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Promo Bulanan',
    content: 'Halo {nama}, kami ingin menginformasikan promo spesial bulan ini! Dapatkan diskon hingga 50% untuk semua produk.',
    createdAt: twoDaysAgo,
  },
  {
    id: 'tpl-002',
    name: 'Undangan Event',
    content: 'Yth. Bapak/Ibu, dengan ini kami mengundang Anda untuk hadir di event spesial kami. Info lebih lanjut hubungi kami.',
    createdAt: yesterday,
  },
  {
    id: 'tpl-003',
    name: 'Reminder Pembayaran',
    content: 'Halo, ini reminder bahwa tagihan Anda akan jatuh tempo dalam 3 hari. Silakan lakukan pembayaran sebelum {tanggal}.',
    createdAt: today,
  },
];

// ===== CONTEXT =====
interface WhatsAppContextType {
  mounted: boolean;
  accounts: WhatsAppAccount[];
  messages: MessageRecord[];
  settings: AppSettings;
  templates: MessageTemplate[];
  sendingState: SendingState;

  // Account actions
  addAccount: (account: Omit<WhatsAppAccount, 'id' | 'messagesSentToday'>) => void;
  updateAccount: (id: string, updates: Partial<WhatsAppAccount>) => void;
  deleteAccount: (id: string) => void;
  toggleAccountEnabled: (id: string) => void;

  // Message actions
  addMessage: (message: Omit<MessageRecord, 'id'>) => void;
  updateMessageStatus: (id: string, status: MessageStatus, errorMessage?: string) => void;

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Template actions
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Sending actions
  setSendingState: (state: Partial<SendingState>) => void;
  addSendLog: (log: Omit<SendLogEntry, 'id' | 'timestamp'>) => void;
  resetSendingState: () => void;

  // Stats
  getConnectedAccounts: () => WhatsAppAccount[];
  getEnabledAccounts: () => WhatsAppAccount[];
  getMessagesSentToday: () => number;
  getPendingMessages: () => number;
  getFailedMessages: () => number;
}

const WhatsAppContext = createContext<WhatsAppContextType | null>(null);

const initialSendingState: SendingState = {
  status: 'idle',
  total: 0,
  sent: 0,
  success: 0,
  failed: 0,
  currentRecipient: '',
  currentAccount: '',
  logs: [],
};

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>(initialAccounts);
  const [messages, setMessages] = useState<MessageRecord[]>(initialMessages);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  const [sendingState, setSendingState] = useState<SendingState>(initialSendingState);

  // Mark as mounted on client to enable interactive features
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Account actions
  const addAccount = useCallback((account: Omit<WhatsAppAccount, 'id' | 'messagesSentToday'>) => {
    const newAccount: WhatsAppAccount = {
      ...account,
      id: `acc-${generateId()}`,
      messagesSentToday: 0,
    };
    setAccounts(prev => [...prev, newAccount]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<WhatsAppAccount>) => {
    setAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, ...updates } : acc)));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const toggleAccountEnabled = useCallback((id: string) => {
    setAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, enabled: !acc.enabled } : acc)));
  }, []);

  // Message actions
  const addMessage = useCallback((message: Omit<MessageRecord, 'id'>) => {
    const newMessage: MessageRecord = {
      ...message,
      id: `msg-${generateId()}`,
    };
    setMessages(prev => [newMessage, ...prev]);
  }, []);

  const updateMessageStatus = useCallback((id: string, status: MessageStatus, errorMessage?: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, status, errorMessage } : msg
    ));
  }, []);

  // Settings actions
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Template actions
  const addTemplate = useCallback((template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: `tpl-${generateId()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTemplates(prev => [...prev, newTemplate]);
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<MessageTemplate>) => {
    setTemplates(prev => prev.map(tpl => (tpl.id === id ? { ...tpl, ...updates } : tpl)));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(tpl => tpl.id !== id));
  }, []);

  // Sending actions
  const setSendingStatePartial = useCallback((state: Partial<SendingState>) => {
    setSendingState(prev => ({ ...prev, ...state }));
  }, []);

  const addSendLog = useCallback((log: Omit<SendLogEntry, 'id' | 'timestamp'>) => {
    const newLog: SendLogEntry = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setSendingState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));
  }, []);

  const resetSendingState = useCallback(() => {
    setSendingState(initialSendingState);
  }, []);

  // Stats
  const getConnectedAccounts = useCallback(() => {
    return accounts.filter(acc => acc.status === 'connected');
  }, [accounts]);

  const getEnabledAccounts = useCallback(() => {
    return accounts.filter(acc => acc.enabled && acc.status === 'connected');
  }, [accounts]);

  const getMessagesSentToday = useCallback(() => {
    return messages.filter(msg => msg.status === 'success').length;
  }, [messages]);

  const getPendingMessages = useCallback(() => {
    return messages.filter(msg => msg.status === 'pending').length;
  }, [messages]);

  const getFailedMessages = useCallback(() => {
    return messages.filter(msg => msg.status === 'failed').length;
  }, [messages]);

  const value: WhatsAppContextType = {
    mounted,
    accounts,
    messages,
    settings,
    templates,
    sendingState,
    addAccount,
    updateAccount,
    deleteAccount,
    toggleAccountEnabled,
    addMessage,
    updateMessageStatus,
    updateSettings,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setSendingState: setSendingStatePartial,
    addSendLog,
    resetSendingState,
    getConnectedAccounts,
    getEnabledAccounts,
    getMessagesSentToday,
    getPendingMessages,
    getFailedMessages,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsAppStore() {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsAppStore must be used within a WhatsAppProvider');
  }
  return context;
}

// ===== UTILITY FUNCTIONS =====
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export function parsePhoneNumbers(text: string): string[] {
  const lines = text.split('\n');
  const phones: string[] = [];
  for (const line of lines) {
    const cleaned = line.trim().replace(/[\s\-()]/g, '');
    if (cleaned.length >= 10) {
      phones.push(formatPhoneNumber(cleaned));
    }
  }
  return phones;
}

export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: MessageStatus | AccountStatus): string {
  switch (status) {
    case 'connected':
    case 'success':
      return '#25D366';
    case 'disconnected':
    case 'failed':
      return '#EA4335';
    case 'scanning':
    case 'pending':
      return '#FBBC04';
    default:
      return '#AEBAC1';
  }
}

export function getStatusLabel(status: MessageStatus | AccountStatus): string {
  switch (status) {
    case 'connected': return 'Terhubung';
    case 'disconnected': return 'Terputus';
    case 'scanning': return 'Memindai QR';
    case 'success': return 'Berhasil';
    case 'failed': return 'Gagal';
    case 'pending': return 'Menunggu';
    default: return status;
  }
}
