type Props = {
    icon?: string;
  
    title: string;
  
    description: string;
  
    actionLabel?: string;
  
    onAction?: () => void;
  };
  
  export default function EmptyState({
    icon = '📊',
    title,
    description,
    actionLabel,
    onAction,
  }: Props) {
    return (
      <div className="empty-state premium-empty-state">
        <div className="empty-state-icon">
          {icon}
        </div>
  
        <strong>{title}</strong>
  
        <span>{description}</span>
  
        {actionLabel && onAction && (
          <button
            type="button"
            className="primary-btn empty-state-action"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }