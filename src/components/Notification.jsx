import { Bell, X } from 'lucide-react';
import { useEffect } from 'react';

export default function Notification({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-white/12 bg-[#211426]/95 px-4 py-3 text-sm text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Bell size={16} /></span>
      <span className="flex-1">{message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose} className="text-neutral-content transition hover:text-white"><X size={16} /></button>
    </div>
  );
}
