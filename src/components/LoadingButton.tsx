import type { ButtonHTMLAttributes, ReactNode } from 'react';

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  children: ReactNode;
};

export default function LoadingButton({
  isLoading = false,
  children,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      type={type}
      className={`${className} ${isLoading ? 'is-loading' : ''}`.trim()}
      disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading && <span className="button-spinner" aria-hidden="true" />}

      <span className="button-label">{children}</span>
    </button>
  );
}