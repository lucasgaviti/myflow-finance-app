import toast from 'react-hot-toast';

const baseOptions = {
  duration: 3200,

  style: {
    minWidth: 'min(280px, calc(100vw - 32px))',
    maxWidth: '420px',
    padding: '14px 16px',
    borderRadius: '10px',
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    boxShadow:
      '0 4px 20px rgba(0,0,0,0.12)',
    fontWeight: '500',
  },
};

export function notifySuccess(
  message: string,
) {
  toast.success(message, {
    ...baseOptions,

    iconTheme: {
      primary: '#22c55e',
      secondary: '#ffffff',
    },
  });
}

export function notifyError(
  message: string,
) {
  toast.error(message, {
    ...baseOptions,
    duration: 4200,

    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  });
}

export function notifyInfo(
  message: string,
) {
  toast(message, {
    ...baseOptions,
    icon: 'ℹ️',
  });
}

export function notifyWarning(
  message: string,
) {
  toast(message, {
    ...baseOptions,
    icon: '⚠️',
    duration: 3800,
  });
}