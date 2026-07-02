import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Flag,
  Pencil,
  Plus,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';

import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import LoadingButton from '../components/LoadingButton';
import Topbar from '../components/Topbar';

import { useGoals } from '../hook/useGoals';

import type { GoalPriority } from '../types/goal';

import { formatMoney } from '../utils/format';

const priorityLabels: Record<GoalPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const priorityClassNames: Record<GoalPriority, string> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

function getTodayInputValue() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrencyInput(input: string) {
  const numeric = input.replace(/\D/g, '');
  const value = Number(numeric) / 100;

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatCurrencyFromNumber(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getProgress(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.min((currentAmount / targetAmount) * 100, 100);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sem prazo';
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

export default function Goals() {
  const navigate = useNavigate();

  const {
    goals,
    isLoading,
    addGoal,
    updateGoal,
    addGoalContribution,
    updateGoalContribution,
    removeGoalContribution,
    removeGoal,
    getGoalContributions,
  } = useGoals();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [formattedTargetAmount, setFormattedTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [formattedCurrentAmount, setFormattedCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [isPrimary, setIsPrimary] = useState(false);

  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [formattedEditTargetAmount, setFormattedEditTargetAmount] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPriority, setEditPriority] = useState<GoalPriority>('medium');
  const [editIsPrimary, setEditIsPrimary] = useState(false);

  const [contributionGoalId, setContributionGoalId] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [formattedContributionAmount, setFormattedContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [contributionDate, setContributionDate] = useState(getTodayInputValue());

  const [editingContributionId, setEditingContributionId] = useState<number | null>(null);
  const [editContributionAmount, setEditContributionAmount] = useState('');
  const [formattedEditContributionAmount, setFormattedEditContributionAmount] = useState('');
  const [editContributionNote, setEditContributionNote] = useState('');
  const [editContributionDate, setEditContributionDate] = useState('');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteContributionId, setDeleteContributionId] = useState<number | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingContribution, setIsUpdatingContribution] = useState(false);
  const [isAddingContribution, setIsAddingContribution] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingContribution, setIsDeletingContribution] = useState(false);

  const selectedContributionGoal = goals.find((goal) => goal.id === contributionGoalId);
  const selectedEditGoal = goals.find((goal) => goal.id === editingGoalId);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((total, goal) => total + goal.targetAmount, 0);
    const totalCurrent = goals.reduce((total, goal) => total + goal.currentAmount, 0);
    const averageProgress =
      goals.length > 0
        ? goals.reduce(
            (total, goal) => total + getProgress(goal.currentAmount, goal.targetAmount),
            0,
          ) / goals.length
        : 0;

    const completedGoals = goals.filter(
      (goal) => goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount,
    ).length;

    return {
      totalTarget,
      totalCurrent,
      averageProgress,
      completedGoals,
      activeGoals: goals.length,
      remainingAmount: Math.max(totalTarget - totalCurrent, 0),
    };
  }, [goals]);

  function handleTargetAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setTargetAmount(String(numeric));
    setFormattedTargetAmount(formatCurrencyInput(raw));
  }

  function handleCurrentAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setCurrentAmount(String(numeric));
    setFormattedCurrentAmount(formatCurrencyInput(raw));
  }

  function handleEditTargetAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setEditTargetAmount(String(numeric));
    setFormattedEditTargetAmount(formatCurrencyInput(raw));
  }

  function handleContributionAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setContributionAmount(String(numeric));
    setFormattedContributionAmount(formatCurrencyInput(raw));
  }

  function handleEditContributionAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setEditContributionAmount(String(numeric));
    setFormattedEditContributionAmount(formatCurrencyInput(raw));
  }

  function resetForm() {
    setTitle('');
    setTargetAmount('');
    setFormattedTargetAmount('');
    setCurrentAmount('');
    setFormattedCurrentAmount('');
    setDeadline('');
    setPriority('medium');
    setIsPrimary(false);
  }

  function resetEditForm() {
    setEditingGoalId(null);
    setEditTitle('');
    setEditTargetAmount('');
    setFormattedEditTargetAmount('');
    setEditDeadline('');
    setEditPriority('medium');
    setEditIsPrimary(false);
  }

  function resetContributionForm() {
    setContributionGoalId(null);
    setContributionAmount('');
    setFormattedContributionAmount('');
    setContributionNote('');
    setContributionDate(getTodayInputValue());
  }

  function resetEditContributionForm() {
    setEditingContributionId(null);
    setEditContributionAmount('');
    setFormattedEditContributionAmount('');
    setEditContributionNote('');
    setEditContributionDate('');
  }

  function handleOpenEditGoal(goalId: number) {
    const goal = goals.find((item) => item.id === goalId);

    if (!goal) {
      return;
    }

    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditTargetAmount(String(goal.targetAmount));
    setFormattedEditTargetAmount(formatCurrencyFromNumber(goal.targetAmount));
    setEditDeadline(goal.deadline ?? '');
    setEditPriority(goal.priority);
    setEditIsPrimary(goal.isPrimary);
  }

  function handleOpenEditContribution(contributionId: number) {
    const contribution = goals
      .flatMap((goal) => getGoalContributions(goal.id))
      .find((item) => item.id === contributionId);

    if (!contribution) {
      return;
    }

    setEditingContributionId(contribution.id);
    setEditContributionAmount(String(contribution.amount));
    setFormattedEditContributionAmount(formatCurrencyFromNumber(contribution.amount));
    setEditContributionNote(contribution.note ?? '');
    setEditContributionDate(contribution.date);
  }

  async function handleCreateGoal() {
    const normalizedTitle = title.trim();

    if (!normalizedTitle || !targetAmount) {
      return;
    }

    setIsCreating(true);

    try {
      await addGoal({
        title: normalizedTitle,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount || 0),
        deadline: deadline || null,
        priority,
        isPrimary,
      });

      resetForm();
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateGoal() {
    const normalizedTitle = editTitle.trim();

    if (!editingGoalId || !normalizedTitle || !editTargetAmount) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateGoal({
        id: editingGoalId,
        title: normalizedTitle,
        targetAmount: Number(editTargetAmount),
        deadline: editDeadline || null,
        priority: editPriority,
        isPrimary: editIsPrimary,
      });

      resetEditForm();
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAddContribution() {
    if (!contributionGoalId || !contributionAmount) {
      return;
    }

    setIsAddingContribution(true);

    try {
      await addGoalContribution({
        goalId: contributionGoalId,
        amount: Number(contributionAmount),
        note: contributionNote.trim() || null,
        date: contributionDate,
      });

      resetContributionForm();
    } finally {
      setIsAddingContribution(false);
    }
  }

  async function handleUpdateContribution() {
    if (!editingContributionId || !editContributionAmount || !editContributionDate) {
      return;
    }

    setIsUpdatingContribution(true);

    try {
      await updateGoalContribution({
        id: editingContributionId,
        amount: Number(editContributionAmount),
        note: editContributionNote.trim() || null,
        date: editContributionDate,
      });

      resetEditContributionForm();
    } finally {
      setIsUpdatingContribution(false);
    }
  }

  async function handleRemoveContribution(id: number) {
    setIsDeletingContribution(true);

    try {
      await removeGoalContribution(id);
      setDeleteContributionId(null);
    } finally {
      setIsDeletingContribution(false);
    }
  }

  async function handleRemoveGoal(id: number) {
    setIsDeleting(true);

    try {
      await removeGoal(id);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="goals-premium-page">
      <Topbar onNewTransaction={() => navigate('/transactions')} />

      <section className="goals-page-header">
        <div>
          <span className="goals-eyebrow">Planejamento financeiro</span>
          <h1>Metas financeiras</h1>
          <p>
            Acompanhe objetivos, aportes e evolução das suas principais metas.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn goals-header-action"
          onClick={handleCreateGoal}
          disabled={isCreating || !title || !targetAmount}
        >
          <Plus size={18} />
          {isCreating ? 'Criando...' : 'Criar meta'}
        </button>
      </section>

      <section className="goals-metric-grid">
        <GoalMetricCard
          icon={CircleDollarSign}
          label="Acumulado"
          value={formatMoney(summary.totalCurrent)}
          description="Total guardado nas metas."
          tone="income"
        />

        <GoalMetricCard
          icon={Target}
          label="Objetivo total"
          value={formatMoney(summary.totalTarget)}
          description="Soma dos valores alvo."
          tone="target"
        />

        <GoalMetricCard
          icon={Trophy}
          label="Progresso médio"
          value={`${summary.averageProgress.toFixed(1)}%`}
          description={`${summary.completedGoals} meta${summary.completedGoals === 1 ? '' : 's'} concluída${summary.completedGoals === 1 ? '' : 's'}.`}
          tone="progress"
        />

        <GoalMetricCard
          icon={Flag}
          label="Falta atingir"
          value={formatMoney(summary.remainingAmount)}
          description={`${summary.activeGoals} meta${summary.activeGoals === 1 ? '' : 's'} ativa${summary.activeGoals === 1 ? '' : 's'}.`}
          tone="remaining"
        />
      </section>

      <section className="goals-create-panel">
        <div className="goals-panel-header">
          <div>
            <h2>Nova meta</h2>
            <p>Defina um objetivo, prazo e prioridade para acompanhar a evolução.</p>
          </div>
        </div>

        <div className="goals-form-grid">
          <input
            className="goals-input goals-form-wide"
            placeholder="Ex: Reserva de emergência"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <input
            className="goals-input"
            inputMode="numeric"
            placeholder="Valor alvo"
            value={formattedTargetAmount}
            onChange={handleTargetAmountChange}
          />

          <input
            className="goals-input"
            inputMode="numeric"
            placeholder="Valor atual"
            value={formattedCurrentAmount}
            onChange={handleCurrentAmountChange}
          />

          <select
            className="goals-input"
            value={priority}
            onChange={(event) => setPriority(event.target.value as GoalPriority)}
          >
            <option value="high">Prioridade alta</option>
            <option value="medium">Prioridade média</option>
            <option value="low">Prioridade baixa</option>
          </select>

          <label className="goals-checkbox-card">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
            />
            <span>Meta principal</span>
          </label>

          <input
            className="goals-input"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />

          <button
            type="button"
            className="primary-btn"
            disabled={isCreating || !title || !targetAmount}
            onClick={handleCreateGoal}
          >
            <Plus size={18} />
            {isCreating ? 'Criando...' : 'Criar meta'}
          </button>
        </div>
      </section>

      <section className="goals-list-panel">
        <div className="goals-panel-header">
          <div>
            <h2>Suas metas</h2>
            <p>
              {goals.length === 0
                ? 'Nenhuma meta cadastrada ainda.'
                : `${goals.length} meta${goals.length === 1 ? '' : 's'} em acompanhamento.`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="goals-loading-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="goals-loading-card">
                <div />
                <span />
                <span className="short" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Nenhuma meta cadastrada"
            description="Crie sua primeira meta financeira para acompanhar seus objetivos com mais clareza."
          />
        ) : (
          <div className="goals-card-grid">
            {goals.map((goal) => {
              const percentage = getProgress(goal.currentAmount, goal.targetAmount);
              const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
              const goalContributions = getGoalContributions(goal.id);
              const latestContributions = goalContributions.slice(0, 3);

              return (
                <article key={goal.id} className="goals-card">
                  <div className="goals-card-main">
                    <div className="goals-card-top">
                      <div>
                        <div className="goals-card-tags">
                          <span className={`goals-priority ${priorityClassNames[goal.priority]}`}>
                            Prioridade {priorityLabels[goal.priority]}
                          </span>

                          {goal.isPrimary && (
                            <span className="goals-primary-badge">
                              Principal
                            </span>
                          )}
                        </div>

                        <h3>{goal.title}</h3>
                      </div>

                      <div className="goals-card-actions">
                        <button
                          type="button"
                          title="Editar meta"
                          onClick={() => handleOpenEditGoal(goal.id)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="danger"
                          title="Excluir meta"
                          onClick={() => setDeleteId(goal.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="goals-progress-block">
                      <div className="goals-progress-header">
                        <span>Progresso</span>
                        <strong>{percentage.toFixed(1)}%</strong>
                      </div>

                      <div className="goals-progress-track">
                        <div
                          className="goals-progress-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="goals-stat-grid">
                      <GoalSmallStat
                        label="Acumulado"
                        value={formatMoney(goal.currentAmount)}
                      />

                      <GoalSmallStat
                        label="Objetivo"
                        value={formatMoney(goal.targetAmount)}
                      />

                      <GoalSmallStat
                        label="Falta"
                        value={formatMoney(remainingAmount)}
                      />

                      <GoalSmallStat
                        label="Prazo"
                        value={formatDate(goal.deadline)}
                      />
                    </div>

                    <div className="goals-card-footer">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setContributionGoalId(goal.id)}
                      >
                        <Plus size={16} />
                        Aporte
                      </button>

                      {percentage >= 100 && (
                        <span className="goals-completed-badge">
                          <CheckCircle2 size={15} />
                          Concluída
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="goals-history-panel">
                    <div className="goals-history-header">
                      <strong>Últimos aportes</strong>
                      <span>
                        {goalContributions.length} registro
                        {goalContributions.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {latestContributions.length === 0 ? (
                      <p className="goals-history-empty">
                        Nenhum aporte registrado ainda.
                      </p>
                    ) : (
                      <div className="goals-history-list">
                        {latestContributions.map((contribution) => (
                          <div key={contribution.id} className="goals-history-row">
                            <div>
                              <strong>{formatMoney(contribution.amount)}</strong>
                              <span>{formatDate(contribution.date)}</span>

                              {contribution.note && (
                                <small>{contribution.note}</small>
                              )}
                            </div>

                            <div className="goals-history-actions">
                              <button
                                type="button"
                                title="Editar aporte"
                                onClick={() => handleOpenEditContribution(contribution.id)}
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                className="danger"
                                title="Remover aporte"
                                onClick={() => setDeleteContributionId(contribution.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editingGoalId && (
        <div className="modal-overlay">
          <div className="modal goals-modal">
            <h2>Editar meta</h2>

            {selectedEditGoal && (
              <p className="modal-description">
                Ajuste os dados principais de <strong>{selectedEditGoal.title}</strong>.
              </p>
            )}

            <div className="goals-modal-form">
              <input
                placeholder="Nome da meta"
                value={editTitle}
                disabled={isUpdating}
                onChange={(event) => setEditTitle(event.target.value)}
              />

              <input
                placeholder="Valor alvo"
                inputMode="numeric"
                value={formattedEditTargetAmount}
                disabled={isUpdating}
                onChange={handleEditTargetAmountChange}
              />

              <select
                value={editPriority}
                disabled={isUpdating}
                onChange={(event) => setEditPriority(event.target.value as GoalPriority)}
              >
                <option value="high">Prioridade alta</option>
                <option value="medium">Prioridade média</option>
                <option value="low">Prioridade baixa</option>
              </select>

              <label className="goals-checkbox-card">
                <input
                  type="checkbox"
                  checked={editIsPrimary}
                  disabled={isUpdating}
                  onChange={(event) => setEditIsPrimary(event.target.checked)}
                />
                <span>Meta principal</span>
              </label>

              <input
                type="date"
                value={editDeadline}
                disabled={isUpdating}
                onChange={(event) => setEditDeadline(event.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                disabled={isUpdating}
                onClick={resetEditForm}
              >
                Cancelar
              </button>

              <LoadingButton
                className="primary-btn"
                isLoading={isUpdating}
                onClick={handleUpdateGoal}
              >
                {isUpdating ? 'Salvando...' : 'Salvar alterações'}
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {contributionGoalId && (
        <div className="modal-overlay">
          <div className="modal goals-modal">
            <h2>Adicionar aporte</h2>

            {selectedContributionGoal && (
              <p className="modal-description">
                Meta: <strong>{selectedContributionGoal.title}</strong>
              </p>
            )}

            <div className="goals-modal-form">
              <input
                placeholder="Valor do aporte"
                inputMode="numeric"
                value={formattedContributionAmount}
                disabled={isAddingContribution}
                onChange={handleContributionAmountChange}
              />

              <input
                placeholder="Observação opcional"
                value={contributionNote}
                disabled={isAddingContribution}
                onChange={(event) => setContributionNote(event.target.value)}
              />

              <input
                type="date"
                value={contributionDate}
                disabled={isAddingContribution}
                onChange={(event) => setContributionDate(event.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                disabled={isAddingContribution}
                onClick={resetContributionForm}
              >
                Cancelar
              </button>

              <LoadingButton
                className="primary-btn"
                isLoading={isAddingContribution}
                onClick={handleAddContribution}
              >
                {isAddingContribution ? 'Salvando...' : 'Salvar aporte'}
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {editingContributionId && (
        <div className="modal-overlay">
          <div className="modal goals-modal">
            <h2>Editar aporte</h2>

            <p className="modal-description">
              Ajuste valor, observação ou data. O progresso será recalculado automaticamente.
            </p>

            <div className="goals-modal-form">
              <input
                placeholder="Valor do aporte"
                inputMode="numeric"
                value={formattedEditContributionAmount}
                disabled={isUpdatingContribution}
                onChange={handleEditContributionAmountChange}
              />

              <input
                placeholder="Observação opcional"
                value={editContributionNote}
                disabled={isUpdatingContribution}
                onChange={(event) => setEditContributionNote(event.target.value)}
              />

              <input
                type="date"
                value={editContributionDate}
                disabled={isUpdatingContribution}
                onChange={(event) => setEditContributionDate(event.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                disabled={isUpdatingContribution}
                onClick={resetEditContributionForm}
              >
                Cancelar
              </button>

              <LoadingButton
                className="primary-btn"
                isLoading={isUpdatingContribution}
                onClick={handleUpdateContribution}
              >
                {isUpdatingContribution ? 'Salvando...' : 'Salvar alterações'}
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Excluir meta?"
        description="Essa ação não pode ser desfeita. Todos os aportes vinculados também serão removidos."
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            handleRemoveGoal(deleteId);
          }
        }}
      />

      <ConfirmModal
        open={Boolean(deleteContributionId)}
        title="Remover aporte?"
        description="O valor será descontado do total acumulado da meta."
        confirmText="Remover"
        cancelText="Cancelar"
        loading={isDeletingContribution}
        onCancel={() => setDeleteContributionId(null)}
        onConfirm={() => {
          if (deleteContributionId) {
            handleRemoveContribution(deleteContributionId);
          }
        }}
      />
    </div>
  );
}

type GoalMetricCardProps = {
  icon: typeof Target;
  label: string;
  value: string;
  description: string;
  tone: 'income' | 'target' | 'progress' | 'remaining';
};

function GoalMetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: GoalMetricCardProps) {
  return (
    <article className={`goals-metric-card ${tone}`}>
      <div className="goals-metric-icon">
        <Icon size={18} />
      </div>

      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

type GoalSmallStatProps = {
  label: string;
  value: string;
};

function GoalSmallStat({ label, value }: GoalSmallStatProps) {
  return (
    <div className="goals-small-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
