import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },
  
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },
  
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },
  
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },
  
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },
  
  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, msgs);
  },
  
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
  
  custom: (component: React.ReactNode, options?) => {
    sonnerToast.custom(component as unknown, options);
  }
};

export default toast;