import toast from 'react-hot-toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const message = options.title 
      ? `${options.title}${options.description ? '\n' + options.description : ''}`
      : options.description || '';

    switch (options.variant) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast(message, {
          icon: '⚠️',
          style: {
            background: '#FEF3C7',
            color: '#92400E',
          },
        });
        break;
      default:
        toast(message);
    }
  };

  return {
    toast: showToast,
  };
}