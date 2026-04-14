'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send,
  Users,
  Smartphone,
  RotateCcw,
  Clock,
  Play,
  Pause,
  Square,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings2,
  Timer,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { useWhatsAppStore, parsePhoneNumbers, getStatusColor } from './WhatsAppStore';
import type { SendMode, MessageStatus } from './WhatsAppStore';

export default function BulkMessenger() {
  const {
    accounts,
    settings,
    templates,
    addMessage,
    setSendingState,
    addSendLog,
    resetSendingState,
    getEnabledAccounts,
  } = useWhatsAppStore();

  // Message state
  const [messageText, setMessageText] = useState('');
  const [contactsText, setContactsText] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('single');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [minDelay, setMinDelay] = useState(settings.defaultMinDelay);
  const [maxDelay, setMaxDelay] = useState(settings.defaultMaxDelay);
  const [messagesPerAccount, setMessagesPerAccount] = useState(settings.messagesPerAccount);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const sendingRef = useRef(false);
  const pausedRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const connectedAccounts = getEnabledAccounts();
  const effectiveSelectedAccountId = selectedAccountId ?? connectedAccounts[0]?.id ?? '';
  const parsedPhones = parsePhoneNumbers(contactsText);
  const charCount = messageText.length;

  // Load template
  const handleLoadTemplate = useCallback((templateId: string) => {
    if (!templateId) return;
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) {
      setMessageText(tpl.content);
      setSelectedTemplate('');
    }
  }, [templates]);

  // Get random delay
  const getDelay = useCallback(() => {
    const min = Math.max(1, minDelay);
    const max = Math.max(min, maxDelay);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }, [minDelay, maxDelay]);

  // Simulate sending a single message
  const simulateSend = useCallback(async (
    phone: string,
    message: string,
    accountId: string
  ): Promise<{ status: MessageStatus; error?: string }> => {
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, accountId }),
      });
      const data = await response.json();
      return {
        status: data.success ? 'success' : 'failed',
        error: data.data?.error,
      };
    } catch {
      return { status: 'failed', error: 'Koneksi gagal' };
    }
  }, []);

  // Main send function
  const startSending = useCallback(async () => {
    if (parsedPhones.length === 0 || !messageText.trim()) return;

    const phonesToSend = [...parsedPhones];
    const total = phonesToSend.length;
    const accountsToUse = sendMode === 'rotation' ? connectedAccounts : 
      connectedAccounts.filter(a => a.id === effectiveSelectedAccountId);

    if (accountsToUse.length === 0) {
      alert('Tidak ada akun yang tersedia untuk pengiriman');
      return;
    }

    sendingRef.current = true;
    pausedRef.current = false;

    setSendingState({
      status: 'sending',
      total,
      sent: 0,
      success: 0,
      failed: 0,
      currentRecipient: '',
      currentAccount: '',
      logs: [],
    });

    let accountIndex = 0;
    let messageCountForAccount = 0;

    for (let i = 0; i < phonesToSend.length; i++) {
      if (!sendingRef.current) {
        setSendingState({ status: 'stopped' });
        break;
      }

      // Wait if paused
      while (pausedRef.current && sendingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!sendingRef.current) {
        setSendingState({ status: 'stopped' });
        break;
      }

      const phone = phonesToSend[i];
      const currentAcc = accountsToUse[accountIndex];

      setSendingState({
        currentRecipient: phone,
        currentAccount: currentAcc.name,
        sent: i + 1,
      });

      // Simulate sending
      const result = await simulateSend(phone, messageText, currentAcc.id);

      addMessage({
        accountId: currentAcc.id,
        accountName: currentAcc.name,
        accountPhone: currentAcc.phoneNumber,
        recipientPhone: phone,
        message: messageText,
        status: result.status,
        timestamp: new Date().toISOString(),
        errorMessage: result.error,
        retryCount: 0,
      });

      addSendLog({
        accountId: currentAcc.id,
        accountPhone: currentAcc.phoneNumber,
        recipientPhone: phone,
        status: result.status,
        errorMessage: result.error,
      });

      setSendingState(prev => ({
        success: prev.success + (result.status === 'success' ? 1 : 0),
        failed: prev.failed + (result.status === 'failed' ? 1 : 0),
      }));

      // Account rotation logic
      messageCountForAccount++;
      if (sendMode === 'rotation' && messageCountForAccount >= messagesPerAccount) {
        accountIndex = (accountIndex + 1) % accountsToUse.length;
        messageCountForAccount = 0;
      }

      // Delay between messages (except for the last one)
      if (i < phonesToSend.length - 1 && sendingRef.current) {
        const delay = getDelay();
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
    }

    if (sendingRef.current) {
      setSendingState({ status: 'completed' });
    }
    sendingRef.current = false;
  }, [parsedPhones, messageText, sendMode, effectiveSelectedAccountId, connectedAccounts, messagesPerAccount, setSendingState, addMessage, addSendLog, simulateSend, getDelay]);

  const handlePause = useCallback(() => {
    pausedRef.current = true;
    setSendingState({ status: 'paused' });
  }, [setSendingState]);

  const handleResume = useCallback(() => {
    pausedRef.current = false;
    setSendingState({ status: 'sending' });
  }, [setSendingState]);

  const handleStop = useCallback(() => {
    sendingRef.current = false;
    pausedRef.current = false;
    setSendingState({ status: 'stopped' });
  }, [setSendingState]);

  const isSending = sendingState.status === 'sending';
  const isPaused = sendingState.status === 'paused';
  const isCompleted = sendingState.status === 'completed';
  const isStopped = sendingState.status === 'stopped';
  const isActive = isSending || isPaused;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#E9EDEF]">Kirim Pesan Massal</h2>
        <p className="text-[#AEBAC1] mt-1">Kirim pesan WhatsApp ke banyak kontak sekaligus</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Composer */}
        <div className="space-y-4">
          {/* Message Composer */}
          <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A3942]">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#25D366]" />
                <h3 className="text-sm font-semibold text-[#E9EDEF]">Pesan</h3>
              </div>
              <div className="flex items-center gap-2">
                {templates.length > 0 && (
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleLoadTemplate(e.target.value)}
                    className="text-xs bg-[#0B141A] border border-[#2A3942] rounded px-2 py-1 text-[#AEBAC1] focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="">Template Pesan</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
                <span className={`text-xs ${charCount > 32000 ? 'text-[#EA4335]' : 'text-[#667781]'}`}>
                  {charCount.toLocaleString()} karakter
                </span>
              </div>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Tulis pesan Anda di sini... Gunakan {nama} atau {tanggal} untuk placeholder."
              rows={6}
              className="w-full px-5 py-4 bg-transparent text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none resize-none"
            />
            {/* Chat bubble preview */}
            {messageText && (
              <div className="px-5 pb-4">
                <p className="text-[10px] text-[#667781] mb-2">Preview:</p>
                <div className="max-w-[80%] bg-[#005C4B] rounded-lg rounded-tl-none px-3 py-2">
                  <p className="text-xs text-[#E9EDEF] whitespace-pre-wrap">{messageText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Input */}
          <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A3942]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#25D366]" />
                <h3 className="text-sm font-semibold text-[#E9EDEF]">Daftar Nomor</h3>
              </div>
              <div className="flex items-center gap-2">
                {parsedPhones.length > 0 && (
                  <span className="text-xs bg-[#25D366]/15 text-[#25D366] px-2 py-0.5 rounded-full font-medium">
                    {parsedPhones.length} nomor
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={contactsText}
              onChange={(e) => setContactsText(e.target.value)}
              placeholder={"Masukkan nomor telepon, satu per baris:\n+62 812-3456-7890\n6281398765432\n0821-1111-2222"}
              rows={6}
              className="w-full px-5 py-4 bg-transparent text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none resize-none font-mono"
              disabled={isActive}
            />
            {parsedPhones.length > 0 && (
              <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                {parsedPhones.slice(0, 5).map((phone, i) => (
                  <span key={i} className="text-[10px] bg-[#1F2C33] text-[#AEBAC1] px-2 py-0.5 rounded-full">
                    {phone}
                  </span>
                ))}
                {parsedPhones.length > 5 && (
                  <span className="text-[10px] text-[#667781] px-2 py-0.5">
                    +{parsedPhones.length - 5} lainnya
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Account Selection */}
          <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2A3942]">
              <Smartphone size={16} className="text-[#25D366]" />
              <h3 className="text-sm font-semibold text-[#E9EDEF]">Pilih Akun Pengirim</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSendMode('single')}
                  disabled={isActive}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                    sendMode === 'single'
                      ? 'bg-[#25D366]/15 border-[#25D366]/50 text-[#25D366]'
                      : 'bg-[#0B141A] border-[#2A3942] text-[#AEBAC1] hover:text-[#E9EDEF] disabled:opacity-50'
                  }`}
                >
                  <Smartphone size={14} />
                  Akun Tunggal
                </button>
                <button
                  onClick={() => setSendMode('rotation')}
                  disabled={isActive}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                    sendMode === 'rotation'
                      ? 'bg-[#25D366]/15 border-[#25D366]/50 text-[#25D366]'
                      : 'bg-[#0B141A] border-[#2A3942] text-[#AEBAC1] hover:text-[#E9EDEF] disabled:opacity-50'
                  }`}
                >
                  <RotateCcw size={14} />
                  Rotasi Akun
                </button>
              </div>

              {sendMode === 'single' && (
                <select
                  value={effectiveSelectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={isActive}
                  className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] disabled:opacity-50"
                >
                  <option value="">Pilih akun...</option>
                  {connectedAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - {acc.phoneNumber}
                    </option>
                  ))}
                </select>
              )}

              {sendMode === 'rotation' && (
                <div className="space-y-2">
                  <p className="text-xs text-[#AEBAC1]">
                    {connectedAccounts.length} akun akan digunakan bergantian
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {connectedAccounts.map(acc => (
                      <span key={acc.id} className="text-[10px] bg-[#25D366]/15 text-[#25D366] px-2 py-0.5 rounded-full">
                        {acc.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Controls & Progress */}
        <div className="space-y-4">
          {/* Advanced Settings */}
          <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-5 py-3 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-[#25D366]" />
                <h3 className="text-sm font-semibold text-[#E9EDEF]">Pengaturan Delay</h3>
              </div>
              {showAdvanced ? <ChevronUp size={16} className="text-[#AEBAC1]" /> : <ChevronDown size={16} className="text-[#AEBAC1]" />}
            </button>
            {showAdvanced && (
              <div className="px-5 pb-4 space-y-3 border-t border-[#2A3942] pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#AEBAC1] mb-1">
                      <Timer size={10} className="inline mr-1" />Min Delay (detik)
                    </label>
                    <input
                      type="number"
                      value={minDelay}
                      onChange={(e) => setMinDelay(Number(e.target.value))}
                      min={1}
                      max={60}
                      disabled={isActive}
                      className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#AEBAC1] mb-1">
                      <Timer size={10} className="inline mr-1" />Max Delay (detik)
                    </label>
                    <input
                      type="number"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(Number(e.target.value))}
                      min={1}
                      max={120}
                      disabled={isActive}
                      className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] disabled:opacity-50"
                    />
                  </div>
                </div>
                {sendMode === 'rotation' && (
                  <div>
                    <label className="block text-xs text-[#AEBAC1] mb-1">
                      Pesan per akun sebelum berganti
                    </label>
                    <input
                      type="number"
                      value={messagesPerAccount}
                      onChange={(e) => setMessagesPerAccount(Number(e.target.value))}
                      min={1}
                      max={100}
                      disabled={isActive}
                      className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between px-5 py-3 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#25D366]" />
                <h3 className="text-sm font-semibold text-[#E9EDEF]">Jadwal</h3>
              </div>
              {showSchedule ? <ChevronUp size={16} className="text-[#AEBAC1]" /> : <ChevronDown size={16} className="text-[#AEBAC1]" />}
            </button>
            {showSchedule && (
              <div className="px-5 pb-4 space-y-3 border-t border-[#2A3942] pt-4">
                <div>
                  <label className="block text-xs text-[#AEBAC1] mb-1">
                    Waktu pengiriman
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={isActive}
                    className="w-full px-3 py-2 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send / Action Buttons */}
          <div className="space-y-2">
            {!isActive && !isCompleted && !isStopped && (
              <button
                onClick={startSending}
                disabled={
                  parsedPhones.length === 0 ||
                  !messageText.trim() ||
                  connectedAccounts.length === 0 ||
                  (sendMode === 'single' && !effectiveSelectedAccountId)
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={16} />
                Kirim Sekarang ({parsedPhones.length} pesan)
              </button>
            )}

            {isSending && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePause}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FBBC04] hover:bg-[#E5A800] text-black rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  <Pause size={16} />
                  Jeda
                </button>
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#EA4335] hover:bg-[#D33426] text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  <Square size={16} />
                  Berhenti
                </button>
              </div>
            )}

            {isPaused && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleResume}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  <Play size={16} />
                  Lanjutkan
                </button>
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#EA4335] hover:bg-[#D33426] text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  <Square size={16} />
                  Berhenti
                </button>
              </div>
            )}

            {(isCompleted || isStopped) && (
              <button
                onClick={resetSendingState}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1F2C33] hover:bg-[#2A3942] text-[#AEBAC1] rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                Kirim Pesan Baru
              </button>
            )}
          </div>

          {/* Progress */}
          {(isActive || isCompleted || isStopped) && (
            <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#2A3942]">
                <h3 className="text-sm font-semibold text-[#E9EDEF]">Progress Pengiriman</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#AEBAC1]">
                      {sendingState.sent} / {sendingState.total} pesan
                    </span>
                    <span className="text-xs font-medium text-[#E9EDEF]">
                      {sendingState.total > 0 ? Math.round((sendingState.sent / sendingState.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#0B141A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${sendingState.total > 0 ? (sendingState.sent / sendingState.total) * 100 : 0}%`,
                        backgroundColor: isStopped ? '#EA4335' : '#25D366',
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0B141A] rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-[#E9EDEF]">{sendingState.sent}</p>
                    <p className="text-[10px] text-[#AEBAC1]">Dikirim</p>
                  </div>
                  <div className="bg-[#0B141A] rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-[#25D366]">{sendingState.success}</p>
                    <p className="text-[10px] text-[#AEBAC1]">Berhasil</p>
                  </div>
                  <div className="bg-[#0B141A] rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-[#EA4335]">{sendingState.failed}</p>
                    <p className="text-[10px] text-[#AEBAC1]">Gagal</p>
                  </div>
                </div>

                {/* Current sending info */}
                {isSending && sendingState.currentRecipient && (
                  <div className="flex items-center gap-2 text-xs text-[#AEBAC1] bg-[#0B141A] rounded-lg p-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                    <span>Mengirim ke <strong className="text-[#E9EDEF]">{sendingState.currentRecipient}</strong></span>
                    <span className="text-[#667781]">via {sendingState.currentAccount}</span>
                  </div>
                )}

                {/* Status badges */}
                {isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-[#25D366] bg-[#25D366]/10 rounded-lg p-3">
                    <CheckCircle size={16} />
                    <span className="font-medium">Pengiriman selesai!</span>
                  </div>
                )}
                {isStopped && (
                  <div className="flex items-center gap-2 text-sm text-[#FBBC04] bg-[#FBBC04]/10 rounded-lg p-3">
                    <AlertCircle size={16} />
                    <span className="font-medium">Pengiriman dihentikan</span>
                  </div>
                )}
              </div>

              {/* Real-time logs */}
              {sendingState.logs.length > 0 && (
                <div className="border-t border-[#2A3942]">
                  <div className="px-5 py-2.5 border-b border-[#2A3942]/50">
                    <p className="text-xs font-medium text-[#AEBAC1]">Log Pengiriman</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {sendingState.logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-2 px-5 py-2 border-b border-[#2A3942]/30 last:border-b-0"
                      >
                        {log.status === 'success' ? (
                          <CheckCircle size={12} className="text-[#25D366] flex-shrink-0" />
                        ) : (
                          <XCircle size={12} className="text-[#EA4335] flex-shrink-0" />
                        )}
                        <span className="text-[11px] text-[#E9EDEF] truncate flex-1">
                          {log.recipientPhone}
                        </span>
                        <span className="text-[10px] text-[#667781] flex-shrink-0">
                          {log.accountPhone}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info box when idle */}
          {!isActive && !isCompleted && !isStopped && (
            <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-[#25D366]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E9EDEF]">Siap Mengirim</p>
                  <p className="text-xs text-[#AEBAC1] mt-1">
                    Tulis pesan, masukkan nomor kontak, pilih akun pengirim, lalu klik &quot;Kirim Sekarang&quot;.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
