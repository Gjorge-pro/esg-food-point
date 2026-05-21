import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          {...toast} 
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ id, message, type, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(), 300);
  };

  const config = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700',
      icon: <CheckCircle className="text-green-600 dark:text-green-400" size={20} />,
      textColor: 'text-green-900 dark:text-green-200'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700',
      icon: <AlertCircle className="text-red-600 dark:text-red-400" size={20} />,
      textColor: 'text-red-900 dark:text-red-200'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700',
      icon: <Info className="text-blue-600 dark:text-blue-400" size={20} />,
      textColor: 'text-blue-900 dark:text-blue-200'
    }
  };

  const style = config[type] || config.info;

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-3 shadow-lg transition ${
        isExiting ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {style.icon}
      </div>
      <p className={`flex-1 text-sm font-medium ${style.textColor}`}>
        {message}
      </p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-ink/40 transition hover:text-ink/60"
      >
        <X size={18} />
      </button>
    </div>
  );
}
