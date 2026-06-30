import {
    Gauge,
    PiggyBank,
    ShieldCheck,
    Star,
  } from 'lucide-react';
  
  import { formatMoney } from '../../utils/format';
  
  type Props = {
    score: number;
    scoreTitle: string;
  
    savingCapacity: number;
  
    currentSavings: number;
  
    primaryGoalTitle?: string;
    primaryGoalRemainingAmount?: number | null;
    primaryGoalMonths?: number | null;
  };
  
  export default function PlanningOverview({
    score,
    scoreTitle,
    savingCapacity,
    currentSavings,
    primaryGoalTitle,
    primaryGoalRemainingAmount,
    primaryGoalMonths,
  }: Props) {
    return (
      <div className="planning-metrics-grid">
        <div className="planning-metric-card">
          <div className="planning-metric-top">
            <div>
              <span className="planning-metric-label">
                Score financeiro
              </span>
  
              <strong className="planning-metric-value">
                {score}/100
              </strong>
            </div>
  
            <div className="planning-metric-icon">
              <Gauge size={20} />
            </div>
          </div>
  
          <p className="planning-metric-description">
            Status atual:{' '}
            <strong>{scoreTitle}</strong>
          </p>
        </div>
  
        <div className="planning-metric-card">
          <div className="planning-metric-top">
            <div>
              <span className="planning-metric-label">
                Capacidade de economia
              </span>
  
              <strong className="planning-metric-value">
                {savingCapacity.toFixed(1)}%
              </strong>
            </div>
  
            <div className="planning-metric-icon">
              <PiggyBank size={20} />
            </div>
          </div>
  
          <p className="planning-metric-description">
            Percentual da renda que sobra.
          </p>
        </div>
  
        <div className="planning-metric-card">
          <div className="planning-metric-top">
            <div>
              <span className="planning-metric-label">
                Reserva atual
              </span>
  
              <strong className="planning-metric-value">
                {formatMoney(currentSavings)}
              </strong>
            </div>
  
            <div className="planning-metric-icon">
              <ShieldCheck size={20} />
            </div>
          </div>
  
          <p className="planning-metric-description">
            Valor disponível hoje.
          </p>
        </div>
  
        <div className="planning-metric-card">
          <div className="planning-metric-top">
            <div>
              <span className="planning-metric-label">
                Meta principal
              </span>
  
              <strong className="planning-metric-value">
                {primaryGoalTitle ?? 'Não definida'}
              </strong>
            </div>
  
            <div className="planning-metric-icon">
              <Star size={20} />
            </div>
          </div>
  
          <p className="planning-metric-description">
            {primaryGoalTitle
              ? `Faltam ${formatMoney(primaryGoalRemainingAmount ?? 0)} · ${primaryGoalMonths ?? 0} meses`
              : 'Defina uma meta principal na tela de metas.'}
          </p>
        </div>
      </div>
    );
  }