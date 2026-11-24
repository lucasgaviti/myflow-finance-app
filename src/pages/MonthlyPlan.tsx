import { useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Loader2,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

import Topbar from '../components/Topbar';
import { useMonthlyPlan } from '../hook/useMonthlyPlan';
import { useTransactions } from '../hook/useTransactions';
import { notifyError, notifySuccess } from '../lib/toast';
import { formatMoney } from '../utils/format';

import type {
  MonthlyPlanItem,
  MonthlyPlanItemType,
} from '../types/monthlyPlan';
import type { TransactionType } from '../types/transaction';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const CATEGORY_GROUPS = [
  {
    title: 'Receitas',
    options: [
      { value: 'Salário', label: 'Salário', icon: '💼' },
      { value: 'Adiantamento', label: 'Adiantamento', icon: '💵' },
      { value: 'Investimentos', label: 'Investimentos', icon: '📈' },
      { value: 'Outras receitas', label: 'Outras receitas', icon: '✨' },
    ],
  },
  {
    title: 'Despesas essenciais',
    options: [
      { value: 'Contas fixas', label: 'Contas fixas', icon: '🧾' },
      { value: 'Moradia', label: 'Moradia', icon: '🏠' },
      { value: 'Financiamento', label: 'Financiamento', icon: '🏦' },
      { value: 'Internet', label: 'Internet', icon: '🌐' },
      { value: 'Saúde', label: 'Saúde', icon: '💊' },
    ],
  },
  {
    title: 'Rotina',
    options: [
      { value: 'Alimentação', label: 'Alimentação', icon: '🍔' },
      { value: 'Transporte', label: 'Transporte', icon: '🚗' },
      { value: 'Lazer', label: 'Lazer', icon: '🎮' },
      { value: 'Educação', label: 'Educação', icon: '🎓' },
      { value: 'Outros', label: 'Outros', icon: '✨' },
    ],
  },
] as const;

type CategoryOption = {
  value: string;
  label: string;
  icon: string;
};

const CATEGORY_OPTIONS = CATEGORY_GROUPS.flatMap<CategoryOption>(
  (group) => group.options,
);

const ITEM_TYPE_OPTIONS = [
  {
    label: 'Receita',
    description: 'Entrada recorrente',
    value: 'income',
    icon: '🟢',
  },
  {
    label: 'Despesa',
    description: 'Conta fixa mensal',
    value: 'fixed_expense',
    icon: '🔴',
  },
] as const;

const DEFAULT_CATEGORY_BY_TYPE: Record<MonthlyPlanItemType, string> = {
  income: 'Salário',
  fixed_expense: 'Contas fixas',
};

const MAX_TITLE_LENGTH = 80;
const CURRENT_DATE = new Date();

type TouchedFields = {
  title: boolean;
  amount: boolean;
  category: boolean;
  dueDate: boolean;
};

type FormErrors = Partial<Record<keyof TouchedFields, string>>;

function getTodayInputValue() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentYearOptions() {
  const currentYear = new Date().getFullYear();

  return [currentYear - 1, currentYear, currentYear + 1];
}

function formatCurrencyInputFromDigits(digits: string) {
  const numericValue = Number(digits.replace(/\D/g, '')) / 100;

  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function parseFormattedCurrency(value: string) {
  return Number(value.replace(/\D/g, '')) / 100;
}

function formatDateLabel(date: string | null) {
  if (!date) {
    return 'Sem data';
  }

  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(localDate);
}

function isOverdue(item: MonthlyPlanItem) {
  if (item.paid || !item.dueDate) {
    return false;
  }

  return item.dueDate < getTodayInputValue();
}

function getFinancialType(itemType: MonthlyPlanItemType): TransactionType {
  return itemType === 'income' ? 'income' : 'expense';
}

function getItemTypeLabel(type: MonthlyPlanItemType) {
  return type === 'income' ? 'Entrada' : 'Despesa fixa';
}

function getStatusLabel(item: MonthlyPlanItem) {
  if (item.paid) {
    return item.type === 'income' ? 'Recebido' : 'Pago';
  }

  return isOverdue(item) ? 'Vencido' : 'Pendente';
}

function getProgressPercentage(done: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min((done / total) * 100, 100);
}

function getCommittedLabel(value: number) {
  if (!Number.isFinite(value)) {
    return '0.0%';
  }

  return `${value.toFixed(1)}%`;
}

function getCategoryMeta(category: string) {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category) ?? {
      value: category,
      label: category,
      icon: '✨',
    }
  );
}

function getCategoryLabel(category: string) {
  const categoryMeta = getCategoryMeta(category);

  return `${categoryMeta.icon} ${categoryMeta.label}`;
}

function sortRecentItems(items: MonthlyPlanItem[]) {
  return [...items]
    .sort((firstItem, secondItem) => {
      const firstDate = firstItem.updatedAt || firstItem.createdAt;
      const secondDate = secondItem.updatedAt || secondItem.createdAt;

      return secondDate.localeCompare(firstDate);
    })
    .slice(0, 4);
}

export default function MonthlyPlan() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_DATE.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_DATE.getFullYear());

  const {
    items,
    summary,
    isLoading,
    addItem,
    updateItem,
    removeItem,
  } = useMonthlyPlan(selectedMonth, selectedYear);

  const { addTransaction, updateTransaction, removeTransaction } = useTransactions();

  const [title, setTitle] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [type, setType] = useState<MonthlyPlanItemType>('fixed_expense');
  const [category, setCategory] = useState('Contas fixas');
  const [dueDate, setDueDate] = useState(getTodayInputValue());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    title: false,
    amount: false,
    category: false,
    dueDate: false,
  });

  const [toggleItem, setToggleItem] = useState<MonthlyPlanItem | null>(null);
  const [settlementDate, setSettlementDate] = useState(getTodayInputValue());
  const [removeLinkedTransaction, setRemoveLinkedTransaction] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const [deleteItem, setDeleteItem] = useState<MonthlyPlanItem | null>(null);
  const [deleteLinkedTransaction, setDeleteLinkedTransaction] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const incomeItems = useMemo(
    () => items.filter((item) => item.type === 'income'),
    [items],
  );

  const expenseItems = useMemo(
    () => items.filter((item) => item.type === 'fixed_expense'),
    [items],
  );

  const incomeProgress = getProgressPercentage(
    summary.receivedIncome,
    summary.expectedIncome,
  );

  const expenseProgress = getProgressPercentage(
    summary.paidFixedExpenses,
    summary.fixedExpenses,
  );

  const selectedPeriodLabel = `${MONTHS[selectedMonth - 1]} de ${selectedYear}`;
  const plannedTotal = summary.expectedIncome + summary.fixedExpenses;
  const confirmedTotal = summary.receivedIncome + summary.paidFixedExpenses;
  const completionProgress = getProgressPercentage(confirmedTotal, plannedTotal);
  const amountValue = parseFormattedCurrency(formattedAmount);
  const formTitleLabel = type === 'income' ? 'Descrição da receita' : 'Descrição da despesa';
  const selectedCategoryMeta = getCategoryMeta(category);

  const recentPlannedItems = useMemo(() => sortRecentItems(items), [items]);

  const formErrors = useMemo<FormErrors>(() => {
    const errors: FormErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      errors.title = 'Informe uma descrição para o item.';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Use pelo menos 3 caracteres.';
    } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      errors.title = `Use no máximo ${MAX_TITLE_LENGTH} caracteres.`;
    }

    if (!amountValue || amountValue <= 0) {
      errors.amount = 'Informe um valor maior que zero.';
    }

    if (!category) {
      errors.category = 'Escolha uma categoria.';
    }

    if (!dueDate) {
      errors.dueDate = 'Informe uma data prevista.';
    }

    return errors;
  }, [amountValue, category, dueDate, title]);

  const isFormValid = Object.keys(formErrors).length === 0;

  function markFieldAsTouched(field: keyof TouchedFields) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  }

  function markAllFieldsAsTouched() {
    setTouched({
      title: true,
      amount: true,
      category: true,
      dueDate: true,
    });
  }

  function handleTypeChange(nextType: MonthlyPlanItemType) {
    setType(nextType);
    setCategory(DEFAULT_CATEGORY_BY_TYPE[nextType]);
    setTouched((currentTouched) => ({
      ...currentTouched,
      category: false,
    }));
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const rawDigits = event.target.value.replace(/\D/g, '').slice(0, 12);

    setFormattedAmount(rawDigits ? formatCurrencyInputFromDigits(rawDigits) : '');
  }

  function resetForm() {
    setTitle('');
    setFormattedAmount('');
    setType('fixed_expense');
    setCategory('Contas fixas');
    setDueDate(getTodayInputValue());
    setEditingItemId(null);
    setTouched({
      title: false,
      amount: false,
      category: false,
      dueDate: false,
    });
  }

  function fillFormToEdit(item: MonthlyPlanItem) {
    setEditingItemId(item.id);
    setTitle(item.title);
    setFormattedAmount(formatMoney(item.amount));
    setType(item.type);
    setCategory(item.category);
    setDueDate(item.dueDate ?? getTodayInputValue());
    setTouched({
      title: true,
      amount: true,
      category: true,
      dueDate: true,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveItem() {
    markAllFieldsAsTouched();

    if (!isFormValid) {
      notifyError('Revise os campos destacados antes de salvar.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingItemId) {
        const currentItem = items.find((item) => item.id === editingItemId);

        const updatedItem = await updateItem(editingItemId, {
          month: selectedMonth,
          year: selectedYear,
          title: title.trim(),
          type,
          amount: amountValue,
          category,
          dueDate,
        });

        if (currentItem?.paid && currentItem.transactionId && updatedItem) {
          await updateTransaction({
            id: currentItem.transactionId,
            title: updatedItem.title,
            value: updatedItem.amount,
            type: getFinancialType(updatedItem.type),
            category: updatedItem.category,
            date: `${updatedItem.paidAt ?? updatedItem.dueDate ?? getTodayInputValue()}T12:00:00`,
          });
        }

        notifySuccess('Item atualizado com sucesso.');
        resetForm();
        return;
      }

      const createdItem = await addItem({
        month: selectedMonth,
        year: selectedYear,
        title: title.trim(),
        type,
        amount: amountValue,
        category,
        dueDate,
      });

      if (createdItem) {
        resetForm();
      }
    } catch {
      notifyError('Não foi possível salvar o item agora.');
    } finally {
      setIsSaving(false);
    }
  }

  function requestToggleItem(item: MonthlyPlanItem) {
    setToggleItem(item);
    setSettlementDate(item.paidAt ?? item.dueDate ?? getTodayInputValue());
    setRemoveLinkedTransaction(Boolean(item.transactionId));
  }

  async function confirmToggleItem() {
    if (!toggleItem) {
      return;
    }

    setIsToggling(true);

    try {
      if (!toggleItem.paid) {
        const createdTransaction = await addTransaction({
          id: 0,
          title: toggleItem.title,
          value: toggleItem.amount,
          type: getFinancialType(toggleItem.type),
          category: toggleItem.category,
          date: `${settlementDate}T12:00:00`,
        });

        await updateItem(toggleItem.id, {
          paid: true,
          paidAt: settlementDate,
          transactionId: createdTransaction?.id ?? null,
        });

        notifySuccess(
          toggleItem.type === 'income'
            ? 'Entrada recebida e registrada em Transações.'
            : 'Conta paga e registrada em Transações.',
        );
      } else {
        if (removeLinkedTransaction && toggleItem.transactionId) {
          await removeTransaction(toggleItem.transactionId);
        }

        await updateItem(toggleItem.id, {
          paid: false,
          paidAt: null,
          transactionId: removeLinkedTransaction ? null : toggleItem.transactionId,
        });

        notifySuccess('Item marcado como pendente.');
      }

      setToggleItem(null);
    } catch {
      notifyError('Não foi possível atualizar o status do item.');
    } finally {
      setIsToggling(false);
    }
  }

  function requestDeleteItem(item: MonthlyPlanItem) {
    setDeleteItem(item);
    setDeleteLinkedTransaction(Boolean(item.transactionId));
  }

  async function confirmDeleteItem() {
    if (!deleteItem) {
      return;
    }

    setIsDeleting(true);

    try {
      if (deleteLinkedTransaction && deleteItem.transactionId) {
        await removeTransaction(deleteItem.transactionId);
      }

      await removeItem(deleteItem.id);
      notifySuccess('Item removido do planejamento.');
      setDeleteItem(null);
    } catch {
      notifyError('Não foi possível excluir o item agora.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mplan-page" aria-label="Planejamento mensal">
      <Topbar />

      <header className="mplan-hero">
        <div className="mplan-hero-content">
          <span className="mplan-eyebrow">Controle recorrente</span>
          <h1>Planejamento Mensal</h1>
          <p>
            Organize contas fixas e entradas previstas antes delas virarem
            transações reais no app.
          </p>
        </div>

        <div className="mplan-hero-insights" aria-label="Resumo financeiro do período">
          <SummaryChip label="Receitas" value={formatMoney(summary.expectedIncome)} tone="income" />
          <SummaryChip label="Despesas" value={formatMoney(summary.fixedExpenses)} tone="expense" />
          <SummaryChip
            label="Saldo previsto"
            value={formatMoney(summary.projectedBalance)}
            tone={summary.projectedBalance >= 0 ? 'income' : 'expense'}
          />
        </div>

        <PeriodControl
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </header>

      <section className="mplan-create-panel" aria-labelledby="mplan-create-title">
        <SmartPlanPanel
          items={items}
          expectedIncome={summary.expectedIncome}
          fixedExpenses={summary.fixedExpenses}
          projectedBalance={summary.projectedBalance}
          completionProgress={completionProgress}
          recentItems={recentPlannedItems}
        />

        <div className="mplan-form-card" aria-label="Cadastro de item recorrente">
          <div className="mplan-form-header">
            <div>
              <span className="mplan-eyebrow">Cadastro inteligente</span>
              <h2 id="mplan-create-title">
                {editingItemId ? 'Editar item recorrente' : 'Novo item recorrente'}
              </h2>
              <p>
                Cadastre uma receita ou despesa mensal. Quando for confirmado,
                o item cria automaticamente uma transação vinculada.
              </p>
            </div>

            <div className={`mplan-form-mode ${type === 'income' ? 'income' : 'expense'}`}>
              {type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {type === 'income' ? 'Receita' : 'Despesa'}
            </div>
          </div>

          <div className="mplan-form-primary-grid">
            <label
              className={`mplan-field mplan-field-title ${touched.title && formErrors.title ? 'has-error' : ''}`}
              htmlFor="mplan-title"
            >
              <span>{formTitleLabel}</span>
              <input
                id="mplan-title"
                placeholder={type === 'income' ? 'Ex.: Salário Lucas' : 'Ex.: Internet, aluguel, financiamento...'}
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                disabled={isSaving}
                aria-invalid={Boolean(touched.title && formErrors.title)}
                aria-describedby="mplan-title-help mplan-title-error"
                onBlur={() => markFieldAsTouched('title')}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className="mplan-field-footer" id="mplan-title-help">
                <small>Use um nome direto para reconhecer esse item depois.</small>
                <small>{title.length}/{MAX_TITLE_LENGTH}</small>
              </div>
              <FieldError id="mplan-title-error" show={touched.title} message={formErrors.title} />
            </label>
          </div>

          <div className="mplan-form-secondary-grid">
            <label
              className={`mplan-field mplan-field-value ${touched.amount && formErrors.amount ? 'has-error' : ''}`}
              htmlFor="mplan-amount"
            >
              <span>Valor mensal</span>
              <input
                id="mplan-amount"
                className="mplan-money-input"
                placeholder="R$ 0,00"
                inputMode="numeric"
                value={formattedAmount}
                disabled={isSaving}
                aria-invalid={Boolean(touched.amount && formErrors.amount)}
                aria-describedby="mplan-amount-error"
                onBlur={() => markFieldAsTouched('amount')}
                onChange={handleAmountChange}
              />
              <FieldError id="mplan-amount-error" show={touched.amount} message={formErrors.amount} />
            </label>

            <div className="mplan-field mplan-field-type">
              <span>Tipo</span>
              <TypeSegment value={type} disabled={isSaving} onChange={handleTypeChange} />
            </div>

            <CategoryCombobox
              value={category}
              selectedCategory={selectedCategoryMeta}
              disabled={isSaving}
              hasError={Boolean(touched.category && formErrors.category)}
              error={formErrors.category}
              showError={touched.category}
              onBlur={() => markFieldAsTouched('category')}
              onChange={(nextCategory) => {
                setCategory(nextCategory);
                markFieldAsTouched('category');
              }}
            />

            <label
              className={`mplan-field mplan-field-date ${touched.dueDate && formErrors.dueDate ? 'has-error' : ''}`}
              htmlFor="mplan-date"
            >
              <span>Data prevista</span>
              <div className="mplan-date-control">
                <CalendarDays size={17} aria-hidden="true" />
                <input
                  id="mplan-date"
                  type="date"
                  value={dueDate}
                  disabled={isSaving}
                  aria-invalid={Boolean(touched.dueDate && formErrors.dueDate)}
                  aria-describedby="mplan-date-error"
                  onBlur={() => markFieldAsTouched('dueDate')}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
              <FieldError id="mplan-date-error" show={touched.dueDate} message={formErrors.dueDate} />
            </label>
          </div>

          <div className="mplan-form-actions">
            <div className={`mplan-form-hint ${isFormValid ? 'valid' : 'invalid'}`} aria-live="polite">
              {isFormValid ? (
                <>
                  <CheckCircle2 size={16} />
                  Pronto para salvar no planejamento de {selectedPeriodLabel}.
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  Preencha os campos obrigatórios para habilitar o cadastro.
                </>
              )}
            </div>

            <div className="mplan-form-buttons">
              {editingItemId && (
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={isSaving}
                  onClick={resetForm}
                >
                  Cancelar edição
                </button>
              )}

              <button
                type="button"
                className={`primary-btn mplan-submit-btn ${type === 'income' ? 'income' : 'expense'}`}
                disabled={isSaving || !isFormValid}
                onClick={handleSaveItem}
              >
                {isSaving ? <Loader2 size={18} className="mplan-spinner" /> : <Plus size={18} />}
                {isSaving
                  ? 'Salvando...'
                  : editingItemId
                    ? 'Salvar item'
                    : 'Adicionar item'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mplan-lists-layout" aria-label="Itens recorrentes planejados">
        <PlanListPanel
          title="Entradas previstas"
          subtitle="Receitas recorrentes"
          description="Receitas mensais que você espera receber no período."
          tone="income"
          emptyTitle="Nenhuma entrada planejada"
          items={incomeItems}
          total={summary.expectedIncome}
          completed={summary.receivedIncome}
          progress={incomeProgress}
          isLoading={isLoading}
          onToggle={requestToggleItem}
          onEdit={fillFormToEdit}
          onDelete={requestDeleteItem}
        />

        <PlanListPanel
          title="Despesas fixas"
          subtitle="Compromissos fixos"
          description="Contas mensais e compromissos recorrentes."
          tone="expense"
          emptyTitle="Nenhuma despesa fixa planejada"
          items={expenseItems}
          total={summary.fixedExpenses}
          completed={summary.paidFixedExpenses}
          progress={expenseProgress}
          isLoading={isLoading}
          onToggle={requestToggleItem}
          onEdit={fillFormToEdit}
          onDelete={requestDeleteItem}
        />
      </section>

      <section className="mplan-reading-panel" aria-labelledby="mplan-reading-title">
        <div className="mplan-reading-heading">
          <span className="mplan-eyebrow">Leitura rápida</span>
          <h2 id="mplan-reading-title">Status do mês</h2>
          <p>Resumo executivo das pendências, confirmações e saldo do período.</p>
        </div>

        <div className="mplan-reading-grid">
          <PlanReadingCard
            icon={WalletCards}
            label="Saldo confirmado"
            value={formatMoney(summary.confirmedBalance)}
            tone={summary.confirmedBalance >= 0 ? 'income' : 'expense'}
          />
          <PlanReadingCard
            icon={CircleDollarSign}
            label="Saldo projetado"
            value={formatMoney(summary.projectedBalance)}
            tone={summary.projectedBalance >= 0 ? 'income' : 'expense'}
          />
          <PlanReadingCard
            icon={ReceiptText}
            label="Pendências"
            value={`${summary.pendingItems} item(ns)`}
            tone="neutral"
          />
          <PlanReadingCard
            icon={AlertTriangle}
            label="Vencidos"
            value={`${summary.overdueItems} item(ns)`}
            tone={summary.overdueItems > 0 ? 'expense' : 'income'}
          />
          <PlanReadingCard
            icon={TrendingDown}
            label="Comprometimento"
            value={getCommittedLabel(summary.committedPercentage)}
            tone="neutral"
          />
          <PlanReadingCard
            icon={CheckCircle2}
            label="Progresso"
            value={`${completionProgress.toFixed(0)}% confirmado`}
            tone="income"
          />
        </div>
      </section>

      {toggleItem && (
        <ConfirmationModal
          title={
            toggleItem.paid
              ? 'Marcar como pendente?'
              : toggleItem.type === 'income'
                ? 'Confirmar recebimento?'
                : 'Confirmar pagamento?'
          }
          description={
            toggleItem.paid
              ? 'Esse item já possui status confirmado no planejamento.'
              : 'Ao confirmar, uma transação será criada automaticamente em Transações.'
          }
          confirmLabel={isToggling ? 'Processando...' : 'Confirmar'}
          isLoading={isToggling}
          onCancel={() => setToggleItem(null)}
          onConfirm={confirmToggleItem}
        >
          {!toggleItem.paid && (
            <label className="monthly-plan-modal-label">
              Data da movimentação
              <input
                type="date"
                value={settlementDate}
                onChange={(event) => setSettlementDate(event.target.value)}
              />
            </label>
          )}

          {toggleItem.paid && toggleItem.transactionId && (
            <label className="monthly-plan-checkbox-line">
              <input
                type="checkbox"
                checked={removeLinkedTransaction}
                onChange={(event) =>
                  setRemoveLinkedTransaction(event.target.checked)
                }
              />
              Remover também a transação vinculada
            </label>
          )}
        </ConfirmationModal>
      )}

      {deleteItem && (
        <ConfirmationModal
          title="Excluir item?"
          description="Essa ação remove o item do planejamento mensal."
          confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir'}
          confirmTone="danger"
          isLoading={isDeleting}
          onCancel={() => setDeleteItem(null)}
          onConfirm={confirmDeleteItem}
        >
          {deleteItem.transactionId && (
            <label className="monthly-plan-checkbox-line">
              <input
                type="checkbox"
                checked={deleteLinkedTransaction}
                onChange={(event) =>
                  setDeleteLinkedTransaction(event.target.checked)
                }
              />
              Remover também a transação vinculada
            </label>
          )}
        </ConfirmationModal>
      )}
    </div>
  );
}

type SummaryChipProps = {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'neutral';
};

function SummaryChip({ label, value, tone }: SummaryChipProps) {
  return (
    <article className={`mplan-summary-chip ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

type PeriodControlProps = {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

function PeriodControl({ month, year, onMonthChange, onYearChange }: PeriodControlProps) {
  return (
    <div className="mplan-period-control" aria-label="Período do planejamento">
      <label htmlFor="mplan-period-month">
        <span>Mês</span>
        <select
          id="mplan-period-month"
          value={month}
          onChange={(event) => onMonthChange(Number(event.target.value))}
        >
          {MONTHS.map((monthName, index) => (
            <option key={monthName} value={index + 1}>
              {monthName}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="mplan-period-year">
        <span>Ano</span>
        <select
          id="mplan-period-year"
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
        >
          {getCurrentYearOptions().map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type SmartPlanPanelProps = {
  items: MonthlyPlanItem[];
  expectedIncome: number;
  fixedExpenses: number;
  projectedBalance: number;
  completionProgress: number;
  recentItems: MonthlyPlanItem[];
};

function SmartPlanPanel({
  items,
  expectedIncome,
  fixedExpenses,
  projectedBalance,
  completionProgress,
  recentItems,
}: SmartPlanPanelProps) {
  return (
    <aside className="mplan-create-intro" aria-label="Resumo inteligente do planejamento">
      <div className="mplan-smart-header">
        <span className="mplan-smart-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <span className="mplan-eyebrow">Itens recorrentes</span>
          <h2>Resumo do mês</h2>
        </div>
      </div>

      <div className="mplan-smart-total">
        <strong>{items.length}</strong>
        <span>{items.length === 1 ? 'item cadastrado' : 'itens cadastrados'}</span>
      </div>

      <div className="mplan-create-stats" aria-label="Indicadores do planejamento">
        <PlanStat label="Receitas" value={formatMoney(expectedIncome)} tone="income" />
        <PlanStat label="Despesas" value={formatMoney(fixedExpenses)} tone="expense" />
        <PlanStat
          label="Saldo"
          value={formatMoney(projectedBalance)}
          tone={projectedBalance >= 0 ? 'income' : 'expense'}
        />
      </div>

      <div className="mplan-smart-progress">
        <div>
          <span>Confirmação do mês</span>
          <strong>{completionProgress.toFixed(0)}%</strong>
        </div>
        <div className="mplan-progress-track" aria-hidden="true">
          <span className="income" style={{ width: `${completionProgress}%` }} />
        </div>
      </div>

      <div className="mplan-smart-note">
        <CheckCircle2 size={15} />
        Confirmar um item cria a movimentação automaticamente em Transações.
      </div>

      <div className="mplan-create-recent">
        <span>Últimos itens</span>
        {recentItems.length === 0 ? (
          <p>Nenhum item cadastrado ainda.</p>
        ) : (
          recentItems.map((item) => (
            <div key={item.id}>
              <strong>{item.title}</strong>
              <small>{getCategoryLabel(item.category)}</small>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

type PlanStatProps = {
  label: string;
  value: string;
  tone: 'income' | 'expense';
};

function PlanStat({ label, value, tone }: PlanStatProps) {
  return (
    <div className={`mplan-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type TypeSegmentProps = {
  value: MonthlyPlanItemType;
  disabled: boolean;
  onChange: (type: MonthlyPlanItemType) => void;
};

function TypeSegment({ value, disabled, onChange }: TypeSegmentProps) {
  return (
    <div className="mplan-type-segment" role="radiogroup" aria-label="Tipo do item recorrente">
      {ITEM_TYPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`mplan-type-option ${value === option.value ? 'active' : ''} ${option.value === 'income' ? 'income' : 'expense'}`}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          role="radio"
          aria-checked={value === option.value}
        >
          <span>{option.icon}</span>
          <strong>{option.label}</strong>
          <small>{option.description}</small>
        </button>
      ))}
    </div>
  );
}

type CategoryComboboxProps = {
  value: string;
  selectedCategory: { value: string; label: string; icon: string };
  disabled: boolean;
  hasError: boolean;
  error?: string;
  showError: boolean;
  onBlur: () => void;
  onChange: (value: string) => void;
};

function CategoryCombobox({
  value,
  selectedCategory,
  disabled,
  hasError,
  error,
  showError,
  onBlur,
  onChange,
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return CATEGORY_GROUPS;
    }

    return CATEGORY_GROUPS.map((group) => ({
      ...group,
      options: group.options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      ),
    })).filter((group) => group.options.length > 0);
  }, [query]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div
      className={`mplan-field mplan-category-field ${hasError ? 'has-error' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <span>Categoria</span>
      <button
        type="button"
        className={`mplan-category-button ${isOpen ? 'open' : ''}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Categoria selecionada: ${selectedCategory.label}`}
        onBlur={onBlur}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="mplan-category-button-icon">{selectedCategory.icon}</span>
        <strong>{selectedCategory.label}</strong>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="mplan-category-popover" role="listbox" aria-label="Categorias disponíveis">
          <label className="mplan-category-search">
            <Search size={15} />
            <input
              autoFocus
              placeholder="Buscar categoria"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="mplan-category-options">
            {filteredGroups.length === 0 ? (
              <p className="mplan-category-empty">Nenhuma categoria encontrada.</p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.title} className="mplan-category-group">
                  <span>{group.title}</span>
                  {group.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={value === option.value ? 'selected' : ''}
                      role="option"
                      aria-selected={value === option.value}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.icon}</span>
                      <strong>{option.label}</strong>
                      {value === option.value && <CheckCircle2 size={15} />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <FieldError id="mplan-category-error" show={showError} message={error} />
    </div>
  );
}

type FieldErrorProps = {
  id: string;
  show: boolean;
  message?: string;
};

function FieldError({ id, show, message }: FieldErrorProps) {
  if (!show || !message) {
    return null;
  }

  return (
    <small id={id} className="mplan-field-error" role="alert">
      {message}
    </small>
  );
}

type PlanListPanelProps = {
  title: string;
  subtitle: string;
  description: string;
  tone: 'income' | 'expense';
  emptyTitle: string;
  items: MonthlyPlanItem[];
  total: number;
  completed: number;
  progress: number;
  isLoading: boolean;
  onToggle: (item: MonthlyPlanItem) => void;
  onEdit: (item: MonthlyPlanItem) => void;
  onDelete: (item: MonthlyPlanItem) => void;
};

function PlanListPanel({
  title,
  subtitle,
  description,
  tone,
  emptyTitle,
  items,
  total,
  completed,
  progress,
  isLoading,
  onToggle,
  onEdit,
  onDelete,
}: PlanListPanelProps) {
  return (
    <article className={`mplan-list-card ${tone}`}>
      <header className="mplan-list-header">
        <div>
          <span className="mplan-eyebrow">{subtitle}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className={`mplan-list-orb ${tone}`} aria-hidden="true">
          {tone === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        </div>
      </header>

      <div className="mplan-list-summary">
        <div>
          <span>Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>

        <div>
          <span>{tone === 'income' ? 'Recebido' : 'Pago'}</span>
          <strong>{formatMoney(completed)}</strong>
        </div>
      </div>

      <div className="mplan-progress-track" aria-label={`${progress.toFixed(0)}% confirmado`}>
        <span className={tone} style={{ width: `${progress}%` }} />
      </div>

      {isLoading ? (
        <div className="mplan-loading-list" aria-label="Carregando itens planejados">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="mplan-loading-row" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mplan-empty-state">
          <Repeat2 size={22} />
          <strong>{emptyTitle}</strong>
          <p>Adicione um item acima para começar a controlar o mês.</p>
        </div>
      ) : (
        <div className="mplan-row-list">
          {items.map((item) => (
            <PlanItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </article>
  );
}

type PlanItemRowProps = {
  item: MonthlyPlanItem;
  onToggle: (item: MonthlyPlanItem) => void;
  onEdit: (item: MonthlyPlanItem) => void;
  onDelete: (item: MonthlyPlanItem) => void;
};

function PlanItemRow({ item, onToggle, onEdit, onDelete }: PlanItemRowProps) {
  const itemStatus = getStatusLabel(item);
  const tone = item.type === 'income' ? 'income' : 'expense';

  return (
    <article className={`mplan-item-row ${item.paid ? 'paid' : ''}`}>
      <button
        type="button"
        className={`mplan-check ${item.paid ? 'paid' : ''}`}
        onClick={() => onToggle(item)}
        aria-label={item.paid ? 'Marcar como pendente' : 'Marcar como concluído'}
      >
        {item.paid ? <CheckCircle2 size={17} /> : <CalendarDays size={17} />}
      </button>

      <div className={`mplan-item-icon ${tone}`} aria-hidden="true">
        {item.type === 'income' ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
      </div>

      <div className="mplan-item-main">
        <strong>{item.title}</strong>
        <p>
          <span>{getCategoryLabel(item.category)}</span>
          {getItemTypeLabel(item.type)} · {formatDateLabel(item.dueDate)}
        </p>
      </div>

      <div className="mplan-item-side">
        <strong className={`mplan-item-value ${tone}`}>
          {item.type === 'income' ? '+' : '-'}
          {formatMoney(item.amount)}
        </strong>

        <span
          className={`mplan-status-pill ${
            item.paid ? 'paid' : isOverdue(item) ? 'overdue' : 'pending'
          }`}
        >
          {itemStatus}
        </span>
      </div>

      <div className="mplan-item-actions">
        <button type="button" aria-label="Editar item" onClick={() => onEdit(item)}>
          <Edit3 size={15} />
        </button>

        <button
          type="button"
          className="danger"
          aria-label="Excluir item"
          onClick={() => onDelete(item)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

type PlanReadingCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'neutral';
};

function PlanReadingCard({ icon: Icon, label, value, tone }: PlanReadingCardProps) {
  return (
    <article className={`mplan-reading-card ${tone}`}>
      <span className="mplan-reading-icon" aria-hidden="true">
        <Icon size={17} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

type ConfirmationModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: 'primary' | 'danger';
  isLoading: boolean;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmationModal({
  title,
  description,
  confirmLabel,
  confirmTone = 'primary',
  isLoading,
  children,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mplan-confirm-title">
      <div className="modal monthly-plan-modal">
        <h2 id="mplan-confirm-title">{title}</h2>
        <p className="modal-description">{description}</p>

        {children}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-btn"
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={confirmTone === 'danger' ? 'danger-btn' : 'primary-btn'}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 size={16} className="mplan-spinner" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
