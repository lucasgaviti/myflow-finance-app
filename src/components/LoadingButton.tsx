import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

type Props =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean;
    children: ReactNode;
  };

export default function LoadingButton({
  isLoading = false,
  children,
  disabled,
  className = '',
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`${className} ${
        isLoading ? 'is-loading' : ''
      }`}
      disabled={disabled || isLoading}
    >
      {isLoading && (
        <span className="button-spinner" />
      )}

      <span className="button-label">
        {children}
      </span>
    </button>
  );
}