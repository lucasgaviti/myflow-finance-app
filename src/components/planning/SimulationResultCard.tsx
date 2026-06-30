import {
    Calculator,
  } from 'lucide-react';
  
  import type {
    FinancialSimulationResult,
  } from '../../utils/financialSimulator';
  
  import { formatMoney } from '../../utils/format';
  
  type Props = {
    result: FinancialSimulationResult;
  };
  
  export default function SimulationResultCard({
    result,
  }: Props) {
    return (
      <div
        className={`planning-diagnosis-card ${
          result.risk === 'high'
            ? 'critical'
            : result.risk === 'medium'
              ? 'attention'
              : 'healthy'
        }`}
      >
        <div className="planning-diagnosis-header">
          <div>
            <span className="goal-eyebrow">
              Resultado da simulação
            </span>
  
            <div className="goal-values">
              <strong>
                {result.risk === 'low'
                  ? 'Risco baixo'
                  : result.risk === 'medium'
                    ? 'Risco médio'
                    : 'Risco alto'}
              </strong>
  
              <span>
                {result.summary}
              </span>
            </div>
          </div>
  
          <div className="planning-metric-icon">
            <Calculator size={20} />
          </div>
        </div>
  
        <div className="planning-alert-list">
          <p className="planning-alert-item">
            Reserva após a compra:{' '}
            <strong>
              {formatMoney(
                result.remainingSavingsAfterPurchase,
              )}
            </strong>
          </p>
  
          <p className="planning-alert-item">
            Sobrevivência após a compra:{' '}
            <strong>
              {result.survivalMonthsAfterPurchase.toFixed(
                1,
              )}{' '}
              meses
            </strong>
          </p>
  
          <p className="planning-alert-item">
            Atraso estimado nas metas:{' '}
            <strong>
              {result.goalDelayMonths} meses
            </strong>
          </p>
  
          {result.warnings.map((warning) => (
            <p
              key={warning}
              className="planning-alert-item"
            >
              • {warning}
            </p>
          ))}
        </div>
      </div>
    );
  }