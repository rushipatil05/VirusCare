import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-navy-900/60" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${maxWidth} bg-white border border-stone-300 rounded-lg shadow-2xl`}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50 rounded-t-lg">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">{title}</h3>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Body */}
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
