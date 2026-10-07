import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutDashboard, Printer, FileBox, Activity, Settings, Plus, RefreshCw, Moon } from 'lucide-react';
import { tr } from '../lib/i18n';
type View = "overview" | "printers" | "files" | "jobs" | "settings";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  setView: (v: View) => void;
  openNewPrinterModal: () => void;
  refreshAll: () => void;
  toggleTheme: () => void;
}

export function CommandPalette({ open, setOpen, setView, openNewPrinterModal, refreshAll, toggleTheme }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const commands = [
    { id: 'overview', icon: <LayoutDashboard size={18} />, label: tr('Genel Bakış', 'Go to Overview'), action: () => setView('overview') },
    { id: 'printers', icon: <Printer size={18} />, label: tr('Yazıcılar', 'Go to Printers'), action: () => setView('printers') },
    { id: 'files', icon: <FileBox size={18} />, label: tr('Dosyalar', 'Go to Files'), action: () => setView('files') },
    { id: 'jobs', icon: <Activity size={18} />, label: tr('İşler', 'Go to Jobs'), action: () => setView('jobs') },
    { id: 'settings', icon: <Settings size={18} />, label: tr('Ayarlar', 'Go to Settings'), action: () => setView('settings') },
    { id: 'add-printer', icon: <Plus size={18} />, label: tr('Yeni Yazıcı Ekle', 'Add New Printer'), action: openNewPrinterModal },
    { id: 'refresh', icon: <RefreshCw size={18} />, label: tr('Tümünü Yenile', 'Refresh All'), action: refreshAll },
    { id: 'theme', icon: <Moon size={18} />, label: tr('Temayı Değiştir', 'Toggle Theme'), action: toggleTheme },
  ].filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % commands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commands[selectedIndex]) {
        commands[selectedIndex].action();
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="cmd-backdrop" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-header">
          <Search size={20} className="cmd-search-icon" />
          <input
            ref={inputRef}
            placeholder={tr("Komut yazın veya arayın...", "Type a command or search...")}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="cmd-list">
          {commands.length === 0 ? (
            <div className="cmd-empty">{tr('Sonuç bulunamadı.', 'No results found.')}</div>
          ) : (
             commands.map((cmd, i) => (
              <div
                key={cmd.id}
                className={`cmd-item ${i === selectedIndex ? 'selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => { cmd.action(); setOpen(false); }}
              >
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
