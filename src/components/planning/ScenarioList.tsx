import EmptyState from '../EmptyState';

import ScenarioCard from './ScenarioCard';

import type {
  FinancialScenario,
} from '../../types/financialScenario';

type Props = {
  scenarios: FinancialScenario[];
  loading: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
};

export default function ScenarioList({
  scenarios,
  loading,
  deletingId,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <p className="dashboard-subtitle">
        Carregando cenários...
      </p>
    );
  }

  if (scenarios.length === 0) {
    return (
      <EmptyState
        icon="🧪"
        title="Nenhum cenário salvo"
        description="Simule uma compra e salve o cenário para comparar decisões futuras."
      />
    );
  }

  return (
    <div className="planning-metrics-grid">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          deleting={deletingId === scenario.id}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}