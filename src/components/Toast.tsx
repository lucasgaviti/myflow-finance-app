import {
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

type ToastType =
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

type Props = {
  message: string;
  type?: ToastType;
};

const icons = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

export default function Toast({
  message,
  type = 'success',
}: Props) {
  const Icon = icons[type];

  return (
    <div className={`toast ${type}`}>
      <Icon size={18} />

      <span>{message}</span>
    </div>
  );
}