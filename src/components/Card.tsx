import type { ReactNode } from 'react';

type Props = {
  title?: string;

  subtitle?: string;

  action?: ReactNode;

  children: ReactNode;
};

export default function Card({
  title,
  subtitle,
  action,
  children,
}: Props) {
  return (
    <div className="card">
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && (
              <h3 className="card-title">
                {title}
              </h3>
            )}

            {subtitle && (
              <p className="card-subtitle">
                {subtitle}
              </p>
            )}
          </div>

          {action && (
            <div className="card-action">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="card-content">
        {children}
      </div>
    </div>
  );
}