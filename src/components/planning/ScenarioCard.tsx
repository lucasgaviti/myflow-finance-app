import {
    Trash2,
  } from 'lucide-react';
  
  import type {
    FinancialScenario,
  } from '../../types/financialScenario';
  
  import { formatMoney } from '../../utils/format';
  
  type Props = {
    scenario: FinancialScenario;
    onDelete: (id: string) => void;
    deleting?: boolean;
  };
  
  const riskLabels = {
    low: 'Risco baixo',
    medium: 'Risco médio',
    high: 'Risco alto',
  };
  
  export default function ScenarioCard({
    scenario,
    onDelete,
    deleting = false,
  }: Props) {
    return (
      <div className="planning-metric-card">
        <div className="planning-metric-top">
          <div>
            <span className="planning-metric-label">
              {riskLabels[scenario.risk]}
            </span>
  
            <strong className="planning-metric-value">
              {scenario.name}
            </strong>
          </div>
  
          <button
            type="button"
            className="delete-btn"
            disabled={deleting}
            onClick={() => onDelete(scenario.id)}
            title="Excluir cenário"
          >
            <Trash2 size={18} />
          </button>
        </div>
  
        <p className="planning-metric-description">
          Compra de{' '}
          <strong>
            {formatMoney(scenario.purchase_amount)}
          </strong>
          . Reserva após compra:{' '}
          <strong>
            {formatMoney(
              scenario.remaining_savings_after_purchase,
            )}
          </strong>
          . Atraso estimado:{' '}
          <strong>
            {scenario.goal_delay_months} meses
          </strong>
          .
        </p>
      </div>
    );
  }