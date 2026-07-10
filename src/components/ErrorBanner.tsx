import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning';
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  variant = 'error',
}) => {
  if (!message) return null;

  const Icon = variant === 'warning' ? AlertTriangle : AlertCircle;

  const styles =
    variant === 'warning'
      ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
      : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 px-4 py-3 border rounded-xl ${styles} text-sm`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p className="flex-1 leading-relaxed break-words">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 hover:opacity-70 rounded flex-shrink-0 transition-opacity"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
