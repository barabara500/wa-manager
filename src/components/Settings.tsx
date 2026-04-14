'use client';

import React, { useState } from 'react';
import {
  Timer,
  RefreshCw,
  FileText,
  Save,
  Plus,
  Trash2,
  Edit3,
  X,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useWhatsAppStore } from './WhatsAppStore';

export default function Settings() {
  const {
    settings,
    templates,
    updateSettings,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useWhatsAppStore();

  const [minDelay, setMinDelay] = useState(settings.defaultMinDelay);
  const [maxDelay, setMaxDelay] = useState(settings.defaultMaxDelay);
  const [messagesPerAccount, setMessagesPerAccount] = useState(settings.messagesPerAccount);
  const [maxRetry, setMaxRetry] = useState(settings.maxRetryAttempts);

  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveSettings = () => {
    updateSettings({
      defaultMinDelay: Math.max(1, minDelay),
      defaultMaxDelay: Math.max(minDelay, maxDelay),
      messagesPerAccount: Math.max(1, messagesPerAccount),
      maxRetryAttempts: Math.max(0, maxRetry),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;
    addTemplate({
      name: newTemplateName.trim(),
      content: newTemplateContent.trim(),
    });
    setNewTemplateName('');
    setNewTemplateContent('');
    setShowNewTemplate(false);
  };

  const handleStartEdit = (id: string, name: string, content: string) => {
    setEditingTemplateId(id);
    setEditTemplateName(name);
    setEditTemplateContent(content);
  };

  const handleSaveEdit = () => {
    if (!editingTemplateId || !editTemplateName.trim()) return;
    updateTemplate(editingTemplateId, {
      name: editTemplateName.trim(),
      content: editTemplateContent.trim(),
    });
    setEditingTemplateId(null);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setDeleteConfirmId(null);
  };

  const handleExportTemplates = () => {
    const data = JSON.stringify(templates, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-pesan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) {
            data.forEach((tpl: { name: string; content: string }) => {
              if (tpl.name && tpl.content) {
                addTemplate({ name: tpl.name, content: tpl.content });
              }
            });
          }
        } catch {
          alert('Format file tidak valid');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#E9EDEF]">Pengaturan</h2>
        <p className="text-[#AEBAC1] mt-1">Konfigurasi sistem WhatsApp Manager</p>
      </div>

      {/* Delay Settings */}
      <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A3942]">
          <Timer size={18} className="text-[#25D366]" />
          <div>
            <h3 className="text-sm font-semibold text-[#E9EDEF]">Pengaturan Delay</h3>
            <p className="text-xs text-[#AEBAC1]">Atur jeda antar pesan untuk menghindari spam</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#E9EDEF] mb-1.5">
                Delay Minimum (detik)
              </label>
              <input
                type="number"
                value={minDelay}
                onChange={(e) => setMinDelay(Number(e.target.value))}
                min={1}
                max={60}
                className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] transition-colors"
              />
              <p className="text-[10px] text-[#667781] mt-1">Minimal 1 detik</p>
            </div>
            <div>
              <label className="block text-sm text-[#E9EDEF] mb-1.5">
                Delay Maksimum (detik)
              </label>
              <input
                type="number"
                value={maxDelay}
                onChange={(e) => setMaxDelay(Number(e.target.value))}
                min={1}
                max={120}
                className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] transition-colors"
              />
              <p className="text-[10px] text-[#667781] mt-1">Sistem akan random delay antara min dan max</p>
            </div>
          </div>

          {/* Visual delay indicator */}
          <div className="bg-[#0B141A] rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#E9EDEF]">{minDelay}s</p>
                <p className="text-[10px] text-[#667781]">Min</p>
              </div>
              <div className="flex-1 relative h-2 bg-[#1F2C33] rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (minDelay / 120) * 100)}%`,
                    backgroundColor: '#25D366',
                  }}
                />
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: `${Math.min(95, (minDelay / 120) * 100)}%`,
                    width: `${Math.max(5, ((maxDelay - minDelay) / 120) * 100)}%`,
                    backgroundColor: '#FBBC04',
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#E9EDEF]">{maxDelay}s</p>
                <p className="text-[10px] text-[#667781]">Max</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Rotation Settings */}
      <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2A3942]">
          <RefreshCw size={18} className="text-[#25D366]" />
          <div>
            <h3 className="text-sm font-semibold text-[#E9EDEF]">Rotasi Akun & Retry</h3>
            <p className="text-xs text-[#AEBAC1]">Pengaturan rotasi akun dan kebijakan percobaan ulang</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#E9EDEF] mb-1.5">
                Pesan per Akun sebelum Berganti
              </label>
              <input
                type="number"
                value={messagesPerAccount}
                onChange={(e) => setMessagesPerAccount(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] transition-colors"
              />
              <p className="text-[10px] text-[#667781] mt-1">Berapa pesan dikirim dari satu akun sebelum beralih ke akun berikutnya</p>
            </div>
            <div>
              <label className="block text-sm text-[#E9EDEF] mb-1.5">
                Maksimal Percobaan Ulang
              </label>
              <input
                type="number"
                value={maxRetry}
                onChange={(e) => setMaxRetry(Number(e.target.value))}
                min={0}
                max={5}
                className="w-full px-3 py-2.5 bg-[#0B141A] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] transition-colors"
              />
              <p className="text-[10px] text-[#667781] mt-1">Jumlah percobaan ulang untuk pesan yang gagal (0 = tidak ada retry)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
        >
          <Save size={16} />
          Simpan Pengaturan
        </button>
        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-sm text-[#25D366] animate-in fade-in duration-300">
            <CheckCircle size={16} />
            <span>Pengaturan berhasil disimpan!</span>
          </div>
        )}
      </div>

      {/* Message Templates */}
      <div className="bg-[#111B21] border border-[#2A3942] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#25D366]" />
            <div>
              <h3 className="text-sm font-semibold text-[#E9EDEF]">Template Pesan</h3>
              <p className="text-xs text-[#AEBAC1]">Kelola template pesan untuk pengiriman cepat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportTemplates}
              className="p-2 rounded-lg bg-[#1F2C33] hover:bg-[#2A3942] text-[#AEBAC1] hover:text-[#E9EDEF] transition-colors cursor-pointer"
              title="Import Template"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={handleExportTemplates}
              className="p-2 rounded-lg bg-[#1F2C33] hover:bg-[#2A3942] text-[#AEBAC1] hover:text-[#E9EDEF] transition-colors cursor-pointer"
              title="Export Template"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/15 text-[#25D366] rounded-lg text-xs font-medium hover:bg-[#25D366]/25 transition-colors cursor-pointer"
            >
              <Plus size={12} />
              Template Baru
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {templates.length === 0 && !showNewTemplate ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText size={36} className="text-[#667781] mb-2" />
              <p className="text-sm text-[#AEBAC1]">Belum ada template</p>
              <button
                onClick={() => setShowNewTemplate(true)}
                className="text-xs text-[#25D366] mt-2 hover:underline cursor-pointer"
              >
                Buat template pertama
              </button>
            </div>
          ) : (
            <>
              {templates.map((tpl) => (
                <div key={tpl.id} className="bg-[#0B141A] border border-[#2A3942] rounded-lg overflow-hidden">
                  {editingTemplateId === tpl.id ? (
                    <div className="p-4 space-y-3">
                      <input
                        type="text"
                        value={editTemplateName}
                        onChange={(e) => setEditTemplateName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#111B21] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366]"
                        placeholder="Nama template"
                      />
                      <textarea
                        value={editTemplateContent}
                        onChange={(e) => setEditTemplateContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-[#111B21] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] focus:outline-none focus:border-[#25D366] resize-none"
                        placeholder="Isi pesan..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-medium hover:bg-[#128C7E] transition-colors cursor-pointer"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingTemplateId(null)}
                          className="px-3 py-1.5 bg-[#1F2C33] text-[#AEBAC1] rounded-lg text-xs font-medium hover:bg-[#2A3942] transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-[#E9EDEF]">{tpl.name}</h4>
                          <span className="text-[10px] text-[#667781]">{tpl.createdAt}</span>
                        </div>
                        {/* Chat bubble preview */}
                        <div className="max-w-full bg-[#005C4B] rounded-lg rounded-tl-none px-3 py-2 mt-2">
                          <p className="text-xs text-[#E9EDEF] whitespace-pre-wrap line-clamp-3">
                            {tpl.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        {deleteConfirmId === tpl.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="px-2 py-1 rounded text-[10px] bg-[#EA4335] text-white font-medium cursor-pointer"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded text-[10px] bg-[#1F2C33] text-[#AEBAC1] font-medium cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(tpl.id, tpl.name, tpl.content)}
                              className="p-1.5 rounded text-[#AEBAC1] hover:text-[#25D366] hover:bg-[#25D366]/15 transition-colors cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(tpl.id)}
                              className="p-1.5 rounded text-[#AEBAC1] hover:text-[#EA4335] hover:bg-[#EA4335]/15 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* New template form */}
              {showNewTemplate && (
                <div className="bg-[#0B141A] border-2 border-dashed border-[#25D366]/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus size={14} className="text-[#25D366]" />
                    <span className="text-sm font-medium text-[#E9EDEF]">Template Baru</span>
                  </div>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Nama template"
                    className="w-full px-3 py-2 bg-[#111B21] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none focus:border-[#25D366]"
                  />
                  <textarea
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    rows={4}
                    placeholder="Tulis isi pesan template... Gunakan {nama}, {tanggal} sebagai placeholder."
                    className="w-full px-3 py-2 bg-[#111B21] border border-[#2A3942] rounded-lg text-sm text-[#E9EDEF] placeholder-[#667781] focus:outline-none focus:border-[#25D366] resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddTemplate}
                      disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                      className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-medium hover:bg-[#128C7E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Simpan Template
                    </button>
                    <button
                      onClick={() => { setShowNewTemplate(false); setNewTemplateName(''); setNewTemplateContent(''); }}
                      className="px-3 py-1.5 bg-[#1F2C33] text-[#AEBAC1] rounded-lg text-xs font-medium hover:bg-[#2A3942] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#111B21] border border-[#EA4335]/30 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#EA4335]/20">
          <AlertCircle size={18} className="text-[#EA4335]" />
          <div>
            <h3 className="text-sm font-semibold text-[#EA4335]">Zona Bahaya</h3>
            <p className="text-xs text-[#AEBAC1]">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-[#E9EDEF]">Hapus Semua Riwayat Pesan</p>
              <p className="text-xs text-[#667781] mt-0.5">Menghapus seluruh log pesan yang pernah terkirim</p>
            </div>
            <button
              className="px-4 py-2 bg-[#EA4335]/15 text-[#EA4335] rounded-lg text-xs font-medium hover:bg-[#EA4335]/25 transition-colors cursor-pointer border border-[#EA4335]/30 whitespace-nowrap"
              disabled
            >
              <X size={12} className="inline mr-1" />
              Nonaktif (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
