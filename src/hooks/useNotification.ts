import { useState, useCallback } from 'react';
import { NotificationType } from '../components/Notification';
import { translateError } from '../utils/translateError';

interface NotificationState {
  isVisible: boolean;
  type: NotificationType;
  title: string;
  message?: string;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string
  ) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    showNotification('warning', title, message);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    showNotification('info', title, message);
  }, [showNotification]);

  const showOperationError = useCallback((
    error: unknown,
    operation: string,
    entity?: string
  ) => {
    const translated = translateError(error);
    const entityLabel = entity ? ` ${entity}` : '';

    const isTranslated = translated !== (error instanceof Error ? error.message : String(error || ''));
    const isPortuguese = /[áàãâéêíóôõúüç]/.test(translated);

    if (isTranslated || isPortuguese) {
      showError(translated);
    } else {
      showError(`Não foi possível ${operation}${entityLabel}. Tente novamente.`, translated);
    }
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showOperationError
  };
};