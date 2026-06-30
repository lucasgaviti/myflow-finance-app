import {
    TrendingUp,
  } from 'lucide-react';
  
  import type {
    CashFlowProjectionMonth,
  } from '../../utils/cashFlowProjection';
  
  import { formatMoney } from '../../utils/format';
  
  type Props = {
    projection: CashFlowProjectionMonth[];
  };
  
  export default function CashFlowProjectionCard({
    projection,
  }: Props) {
    if (projection.length === 0) {
      return null;
    }
  
    return (
      <div className="planning-form">
        <div className="planning-diagnosis-card healthy">
          <div className="planning-diagnosis-header">
            <div>
              <span className="goal-eyebrow">
                Projeção futura
              </span>
  
              <div className="goal-values">
                <strong>
                  {projection.length} meses
                </strong>
  
                <span>
                  Evolução da reserva e das metas
                </span>
              </div>
            </div>
  
            <div className="planning-metric-icon">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
  
        <div className="planning-metrics-grid">
          {projection.map((month) => (
            <div
              key={month.month}
              className="planning-metric-card"
            >
              <div className="planning-metric-top">
                <div>
                  <span className="planning-metric-label">
                    {month.label}
                  </span>
  
                  <strong className="planning-metric-value">
                    Mês {month.month}
                  </strong>
                </div>
              </div>
  
              <p className="planning-metric-description">
                Reserva:
                <br />
                <strong>
                  {formatMoney(
                    month.projectedSavings,
                  )}
                </strong>
              </p>
  
              <p className="planning-metric-description">
                Metas acumuladas:
                <br />
                <strong>
                  {formatMoney(
                    month.projectedGoalsContribution,
                  )}
                </strong>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }