import {
  useState,
} from 'react';

import {
  Pencil,
  Trash2,
} from 'lucide-react';

import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import LoadingButton from '../components/LoadingButton';

import { useGoals } from '../hook/useGoals';

import type {
  GoalPriority,
} from '../types/goal';

import { formatMoney } from '../utils/format';

const priorityLabels: Record<GoalPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export default function Goals() {
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
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().split('T')[0],
  );

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

  function formatCurrency(input: string) {
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

  function handleTargetAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setTargetAmount(String(numeric));
    setFormattedTargetAmount(formatCurrency(raw));
  }

  function handleCurrentAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setCurrentAmount(String(numeric));
    setFormattedCurrentAmount(formatCurrency(raw));
  }

  function handleEditTargetAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setEditTargetAmount(String(numeric));
    setFormattedEditTargetAmount(formatCurrency(raw));
  }

  function handleContributionAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setContributionAmount(String(numeric));
    setFormattedContributionAmount(formatCurrency(raw));
  }

  function handleEditContributionAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numeric = Number(raw) / 100;

    setEditContributionAmount(String(numeric));
    setFormattedEditContributionAmount(formatCurrency(raw));
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
    setContributionDate(new Date().toISOString().split('T')[0]);
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

    if (!goal) return;

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

    if (!contribution) return;

    setEditingContributionId(contribution.id);
    setEditContributionAmount(String(contribution.amount));
    setFormattedEditContributionAmount(formatCurrencyFromNumber(contribution.amount));
    setEditContributionNote(contribution.note ?? '');
    setEditContributionDate(contribution.date);
  }

  async function handleCreateGoal() {
    if (!title || !targetAmount) return;

    setIsCreating(true);

    try {
      await addGoal({
        title,
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
    if (!editingGoalId || !editTitle || !editTargetAmount) return;

    setIsUpdating(true);

    try {
      await updateGoal({
        id: editingGoalId,
        title: editTitle,
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
    if (!contributionGoalId || !contributionAmount) return;

    setIsAddingContribution(true);

    try {
      await addGoalContribution({
        goalId: contributionGoalId,
        amount: Number(contributionAmount),
        note: contributionNote || null,
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
        note: editContributionNote || null,
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

  const selectedContributionGoal = goals.find((goal) => goal.id === contributionGoalId);
  const selectedEditGoal = goals.find((goal) => goal.id === editingGoalId);

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Metas Financeiras
        </h1>

        <p className="dashboard-subtitle">
          Acompanhe seus objetivos financeiros e veja sua evolução.
        </p>
      </div>

      <Card title="Nova Meta">
        <div className="goal-form">
          <input
            className="search-input"
            placeholder="Ex: Reserva de emergência"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <input
            className="search-input"
            inputMode="numeric"
            placeholder="Valor alvo"
            value={formattedTargetAmount}
            onChange={handleTargetAmountChange}
          />

          <input
            className="search-input"
            inputMode="numeric"
            placeholder="Valor atual"
            value={formattedCurrentAmount}
            onChange={handleCurrentAmountChange}
          />

          <select
            className="filter-select"
            value={priority}
            onChange={(event) => setPriority(event.target.value as GoalPriority)}
          >
            <option value="high">Prioridade alta</option>
            <option value="medium">Prioridade média</option>
            <option value="low">Prioridade baixa</option>
          </select>

          <label className="secondary-btn">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
            />
            Meta principal
          </label>

          <input
            className="search-input"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />

          <button
            className="primary-btn"
            disabled={isCreating}
            onClick={handleCreateGoal}
          >
            {isCreating ? 'Criando...' : '+ Criar meta'}
          </button>
        </div>
      </Card>

      <div className="goals-grid">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-stack">
                <div className="skeleton skeleton-line medium" />
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          ))
        ) : goals.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Nenhuma meta cadastrada"
            description="Crie sua primeira meta financeira para acompanhar seus objetivos com mais clareza."
          />
        ) : (
          goals.map((goal) => {
            const percentage =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;

            const remainingAmount = Math.max(
              goal.targetAmount - goal.currentAmount,
              0,
            );

            const goalContributions = getGoalContributions(goal.id);
            const latestContributions = goalContributions.slice(0, 3);

            return (
              <div key={goal.id} className="goal-card">
                <div className="goal-card-header">
                  <div>
                    <span className="goal-eyebrow">
                      Meta financeira · Prioridade {priorityLabels[goal.priority]}
                      {goal.isPrimary ? ' · Principal' : ''}
                    </span>

                    <h3>{goal.title}</h3>
                  </div>

                  <div className="transaction-buttons">
                    <button
                      type="button"
                      className="edit-btn"
                      title="Editar meta"
                      onClick={() => handleOpenEditGoal(goal.id)}
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      className="delete-btn"
                      title="Excluir meta"
                      onClick={() => setDeleteId(goal.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="goal-values">
                  <strong>
                    {formatMoney(goal.currentAmount)}
                  </strong>

                  <span>
                    de {formatMoney(goal.targetAmount)}
                  </span>
                </div>

                <div className="goal-progress">
                  <div
                    className="goal-progress-bar"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <div className="goal-footer">
                  <span>
                    {percentage.toFixed(0)}% concluído
                  </span>

                  {goal.deadline && (
                    <span>
                      Prazo:{' '}
                      {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString(
                        'pt-BR',
                      )}
                    </span>
                  )}
                </div>

                <div className="goal-card-actions">
                  <span>
                    Falta {formatMoney(remainingAmount)}
                  </span>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setContributionGoalId(goal.id)}
                  >
                    + Aporte
                  </button>
                </div>

                <div className="goal-history">
                  <div className="goal-history-header">
                    <strong>
                      Últimos aportes
                    </strong>

                    <span>
                      {goalContributions.length} registro
                      {goalContributions.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {latestContributions.length === 0 ? (
                    <p className="goal-history-empty">
                      Nenhum aporte registrado ainda.
                    </p>
                  ) : (
                    <div className="goal-history-list">
                      {latestContributions.map((contribution) => (
                        <div
                          key={contribution.id}
                          className="goal-history-item"
                        >
                          <div>
                            <strong>
                              {formatMoney(contribution.amount)}
                            </strong>

                            <span>
                              {new Date(
                                `${contribution.date}T12:00:00`,
                              ).toLocaleDateString('pt-BR')}
                            </span>

                            {contribution.note && (
                              <small>
                                {contribution.note}
                              </small>
                            )}
                          </div>

                          <div className="transaction-buttons">
                            <button
                              type="button"
                              className="edit-btn"
                              title="Editar aporte"
                              onClick={() =>
                                handleOpenEditContribution(contribution.id)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              title="Remover aporte"
                              onClick={() =>
                                setDeleteContributionId(contribution.id)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingGoalId && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              Editar meta
            </h2>

            {selectedEditGoal && (
              <p className="modal-description">
                Ajuste os dados principais da meta sem alterar os aportes já registrados.
              </p>
            )}

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

            <label className="secondary-btn">
              <input
                type="checkbox"
                checked={editIsPrimary}
                disabled={isUpdating}
                onChange={(event) => setEditIsPrimary(event.target.checked)}
              />
              Meta principal
            </label>

            <input
              type="date"
              value={editDeadline}
              disabled={isUpdating}
              onChange={(event) => setEditDeadline(event.target.value)}
            />

            <div className="modal-actions">
              <button
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
          <div className="modal">
            <h2>
              Adicionar aporte
            </h2>

            {selectedContributionGoal && (
              <p className="modal-description">
                Meta: <strong>{selectedContributionGoal.title}</strong>
              </p>
            )}

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

            <div className="modal-actions">
              <button
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
          <div className="modal">
            <h2>
              Editar aporte
            </h2>

            <p className="modal-description">
              Ajuste valor, observação ou data. O progresso da meta será recalculado automaticamente.
            </p>

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

            <div className="modal-actions">
              <button
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