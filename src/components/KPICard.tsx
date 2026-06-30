import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
} from 'lucide-react';

type KPIVariant =
  | 'balance'
  | 'income'
  | 'expense'
  | 'score'
  | 'goal';

type Props = {
  label: string;
  value: string;
  variant?: KPIVariant;
  description?: string;
  trend?: string;
};

export default function KPICard({
  label,
  value,
  variant = 'balance',
  description,
  trend,
}: Props) {
  function getIcon() {
    switch (variant) {
      case 'balance':
        return <Wallet size={22} />;

      case 'income':
        return <TrendingUp size={22} />;

      case 'expense':
        return <TrendingDown size={22} />;

      case 'score':
        return <ShieldCheck size={22} />;

      case 'goal':
        return <Target size={22} />;

      default:
        return <Wallet size={22} />;
    }
  }

  const isNegative =
    variant === 'expense';

  return (
    <div
      className={`kpi-card kpi-card-${variant}`}
      style={{
        minHeight: 138,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -18,
          top: -18,
          width: 88,
          height: 88,
          borderRadius: '50%',
          background:
            variant === 'income'
              ? 'rgba(34, 197, 94, 0.10)'
              : variant === 'expense'
                ? 'rgba(248, 113, 113, 0.10)'
                : 'rgba(37, 99, 235, 0.12)',
          pointerEvents: 'none',
        }}
      />

      <div className="kpi-header">
        <div className="kpi-icon">
          {getIcon()}
        </div>

        <span className="kpi-label">
          {label}
        </span>
      </div>

      <div>
        <strong
          className="kpi-value"
          style={{
            display: 'block',
            fontSize: 30,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
          }}
        >
          {value}
        </strong>

        {(description || trend) && (
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gap: 5,
            }}
          >
            {description && (
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(148, 163, 184, 0.92)',
                }}
              >
                {description}
              </span>
            )}

            {trend && (
              <span
                style={{
                  width: 'fit-content',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  color: isNegative
                    ? '#fca5a5'
                    : '#86efac',
                  background: isNegative
                    ? 'rgba(248, 113, 113, 0.10)'
                    : 'rgba(34, 197, 94, 0.10)',
                }}
              >
                {trend}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
