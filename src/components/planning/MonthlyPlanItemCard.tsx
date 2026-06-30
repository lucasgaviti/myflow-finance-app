import {
    CalendarDays,
    CheckCircle2,
    Circle,
    Trash2,
  } from 'lucide-react';
  
  import type {
    MonthlyPlanItem,
  } from '../../types/monthlyPlan';
  
  import {
    formatMoney,
  } from '../../utils/format';
  
  type Props = {
    item: MonthlyPlanItem;
  
    onTogglePaid: (item: MonthlyPlanItem) => void;
  
    onDelete: (item: MonthlyPlanItem) => void;
  };
  
  function formatDueDate(
    value: string | null,
  ) {
    if (!value) {
      return 'Sem data';
    }
  
    return new Date(
      `${value}T12:00:00`,
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }
  
  export default function MonthlyPlanItemCard({
    item,
    onTogglePaid,
    onDelete,
  }: Props) {
    const isIncome =
      item.type === 'income';
  
    return (
      <article
        className={`monthly-plan-item ${
          item.paid ? 'is-paid' : ''
        } ${isIncome ? 'income' : 'expense'}`}
      >
        <button
          type="button"
          className="monthly-plan-check"
          onClick={() =>
            onTogglePaid(item)
          }
          aria-label={
            item.paid
              ? 'Marcar como pendente'
              : 'Marcar como pago'
          }
        >
          {item.paid ? (
            <CheckCircle2 size={21} />
          ) : (
            <Circle size={21} />
          )}
        </button>
  
        <div className="monthly-plan-item-main">
          <strong>
            {item.title}
          </strong>
  
          <span>
            <CalendarDays size={14} />
            {formatDueDate(item.dueDate)}
          </span>
        </div>
  
        <div className="monthly-plan-item-side">
          <strong>
            {isIncome ? '+' : '-'}
            {formatMoney(item.amount)}
          </strong>
  
          <span
            className={`monthly-plan-status ${
              item.paid ? 'paid' : 'pending'
            }`}
          >
            {item.paid
              ? isIncome
                ? 'Recebido'
                : 'Pago'
              : 'Pendente'}
          </span>
        </div>
  
        <button
          type="button"
          className="monthly-plan-delete"
          onClick={() =>
            onDelete(item)
          }
          aria-label="Excluir item"
        >
          <Trash2 size={16} />
        </button>
      </article>
    );
  }
  