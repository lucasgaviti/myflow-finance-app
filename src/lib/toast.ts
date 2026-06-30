import toast from 'react-hot-toast';

const baseOptions = {
  duration: 3200,

  style: {
    minWidth: '280px',
    maxWidth: '420px',
    padding: '14px 16px',
    borderRadius: '18px',
    background: '#111827',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow:
      '0 20px 45px rgba(0,0,0,0.28)',
    fontWeight: '700',
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