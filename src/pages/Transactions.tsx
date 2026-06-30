import {
  useMemo,
  useState,
} from 'react';

import {
  ChevronDown,
} from 'lucide-react';

import toast from 'react-hot-toast';

import Card from '../components/Card';
import TransactionsList from '../components/TransactionsList';
import KPICard from '../components/KPICard';
import TransactionModal from '../components/TransactionModal';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';

import { useTransactions } from '../hook/useTransactions';

import {
  listMonthlyPlanItems,
  updateMonthlyPlanItem,
} from '../services/monthlyPlanService';

import { formatMoney } from '../utils/format';
import { exportToCSV } from '../utils/export';

import type {
  Transaction,
  TransactionType,
} from '../types/transaction';

import type {
  MonthlyPlanItem,
} from '../types/monthlyPlan';

const categories = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Moradia',
  'Salário',
  'Investimentos',
  'Outros',
];


type PlanSuggestion = {
  transaction: Transaction;
  item: MonthlyPlanItem;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getTransactionMonthYear(
  date: string,
) {
  const transactionDate =
    new Date(date);

  return {
    month:
      transactionDate.getMonth() + 1,

    year:
      transactionDate.getFullYear(),
  };
}

function isSameFinancialType(
  transaction: Transaction,
  item: MonthlyPlanItem,
) {
  if (transaction.type === 'income') {
    return item.type === 'income';
  }

  return item.type === 'fixed_expense';
}

function isSimilarTitle(
  transactionTitle: string,
  planTitle: string,
) {
  const normalizedTransaction =
    normalizeText(transactionTitle);

  const normalizedPlan =
    normalizeText(planTitle);

  if (
    normalizedTransaction ===
    normalizedPlan
  ) {
    return true;
  }

  return (
    normalizedTransaction.includes(
      normalizedPlan,
    ) ||
    normalizedPlan.includes(
      normalizedTransaction,
    )
  );
}

function findMatchingPlanItem({
  transaction,
  items,
}: {
  transaction: Transaction;
  items: MonthlyPlanItem[];
}) {
  return items.find((item) => {
    const sameType =
      isSameFinancialType(
        transaction,
        item,
      );

    const sameValue =
      Math.abs(
        transaction.value -
          item.amount,
      ) < 0.01;

    const similarTitle =
      isSimilarTitle(
        transaction.title,
        item.title,
      );

    return (
      !item.paid &&
      sameType &&
      sameValue &&
      similarTitle
    );
  });
}

export default function Transactions() {
  const {
    transactions,
    isLoading,
    addTransaction,
    removeTransaction,
    removeTransactions,
    updateTransaction,
  } = useTransactions();

  const [search, setSearch] =
    useState('');

  const [filterType, setFilterType] =
    useState<
      'all' | TransactionType
    >('all');

  const [
    filterCategory,
    setFilterCategory,
  ] = useState('all');

  const [showModal, setShowModal] =
    useState(false);

  const [title, setTitle] =
    useState('');

  const [value, setValue] =
    useState('');

  const [
    formattedValue,
    setFormattedValue,
  ] = useState('');

  const [type, setType] =
    useState<TransactionType>(
      'expense',
    );

  const [category, setCategory] =
    useState('Outros');

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .split('T')[0],
    );

  const [editId, setEditId] =
    useState<number | null>(
      null,
    );

  const [deleteId, setDeleteId] =
    useState<number | null>(
      null,
    );

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<number[]>([]);

  const [
    showBulkDeleteModal,
    setShowBulkDeleteModal,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    pendingPlanSuggestion,
    setPendingPlanSuggestion,
  ] = useState<PlanSuggestion | null>(
    null,
  );

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  function formatCurrency(
    input: string,
  ) {
    const numeric =
      input.replace(/\D/g, '');

    const value =
      Number(numeric) / 100;

    return value.toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      },
    );
  }

  function handleValueChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const raw =
      e.target.value.replace(
        /\D/g,
        '',
      );

    const numeric =
      Number(raw) / 100;

    setValue(String(numeric));

    setFormattedValue(
      formatCurrency(raw),
    );
  }


  async function checkPlanSuggestion(
    transaction: Transaction | null,
  ) {
    if (!transaction) {
      return;
    }

    const {
      month,
      year,
    } = getTransactionMonthYear(
      transaction.date,
    );

    const monthlyPlanItems =
      await listMonthlyPlanItems({
        month,
        year,
      });

    const matchingItem =
      findMatchingPlanItem({
        transaction,
        items: monthlyPlanItems,
      });

    if (!matchingItem) {
      return;
    }

    setPendingPlanSuggestion({
      transaction,
      item: matchingItem,
    });
  }

  async function handleLinkTransactionToPlan() {
    if (!pendingPlanSuggestion) {
      return;
    }

    await updateMonthlyPlanItem(
      pendingPlanSuggestion.item.id,
      {
        paid: true,
        transactionId:
          pendingPlanSuggestion
            .transaction.id,
      },
    );

    toast.success(
      'Planejamento atualizado com essa transação.',
    );

    setPendingPlanSuggestion(null);
  }

  function resetForm() {
    setTitle('');
    setValue('');
    setFormattedValue('');
    setType('expense');
    setCategory('Outros');

    setDate(
      new Date()
        .toISOString()
        .split('T')[0],
    );
  }

  function handleNewTransaction() {
    setEditId(null);
    resetForm();
    setShowModal(true);
  }

  async function handleAddTransaction() {
    if (!title || !value)
      return;

    setIsSaving(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 500),
    );

    const newTransaction: Transaction =
      {
        id: Date.now(),
        title,
        value: Number(value),
        type,
        category,
        date:
          new Date(date).toISOString(),
      };

    const createdTransaction =
      await addTransaction(
        newTransaction,
      );

    await checkPlanSuggestion(
      createdTransaction,
    );

    resetForm();
    setShowModal(false);
    setIsSaving(false);
  }

  function handleEditTransaction(
    id: number,
  ) {
    const transaction =
      transactions.find(
        (item) =>
          item.id === id,
      );

    if (!transaction)
      return;

    setTitle(
      transaction.title,
    );

    setValue(
      String(
        transaction.value,
      ),
    );

    setFormattedValue(
      formatMoney(
        transaction.value,
      ),
    );

    setType(
      transaction.type,
    );

    setCategory(
      transaction.category,
    );

    setDate(
      transaction.date.split(
        'T',
      )[0],
    );

    setEditId(id);
    setShowModal(true);
  }

  async function handleSaveEditedTransaction() {
    if (!title || !value || !editId)
      return;

    setIsSaving(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 500),
    );

    const updatedTransaction = {
      id: editId,
      title,
      value: Number(value),
      type,
      category,
      date:
        new Date(date).toISOString(),
    };

    await updateTransaction(
      updatedTransaction,
    );

    await checkPlanSuggestion(
      updatedTransaction,
    );

    setEditId(null);
    resetForm();
    setShowModal(false);
    setIsSaving(false);
  }

  async function handleRemoveTransaction(
    id: number,
  ) {
    setIsDeleting(true);

    try {
      await removeTransaction(id);

      setSelectedIds((prev) =>
        prev.filter(
          (itemId) =>
            itemId !== id,
        ),
      );

      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const categoryOptions =
    useMemo(
      () =>
        Array.from(
          new Set([
            ...categories,
            ...transactions.map(
              (transaction) =>
                transaction.category,
            ),
          ]),
        ).filter(Boolean),
      [transactions],
    );

  const filteredTransactions =
    transactions.filter((item) => {
      const matchesSearch =
        item.title
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          ) ||
        item.category
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          );

      const matchesType =
        filterType === 'all'
          ? true
          : item.type ===
            filterType;

      const matchesCategory =
        filterCategory === 'all'
          ? true
          : item.category ===
            filterCategory;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      );
    });

  const filteredIncome =
    filteredTransactions
      .filter(
        (item) =>
          item.type === 'income',
      )
      .reduce(
        (acc, item) =>
          acc + item.value,
        0,
      );

  const filteredExpense =
    filteredTransactions
      .filter(
        (item) =>
          item.type === 'expense',
      )
      .reduce(
        (acc, item) =>
          acc + item.value,
        0,
      );

  const filteredBalance =
    filteredIncome -
    filteredExpense;

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterType !== 'all' ||
    filterCategory !== 'all';

  const transactionKpis = [
    {
      label: 'Saldo',
      value:
        formatMoney(
          filteredBalance,
        ),
      variant: 'balance' as const,
      description:
        'Resultado das transações filtradas.',
      trend:
        filteredBalance >= 0
          ? 'Positivo'
          : 'Atenção',
    },
    {
      label: 'Entradas',
      value:
        formatMoney(
          filteredIncome,
        ),
      variant: 'income' as const,
      description:
        'Receitas encontradas no filtro.',
    },
    {
      label: 'Saídas',
      value:
        formatMoney(
          filteredExpense,
        ),
      variant: 'expense' as const,
      description:
        'Despesas encontradas no filtro.',
    },
    {
      label: 'Movimentações',
      value: String(
        filteredTransactions.length,
      ),
      variant: 'score' as const,
      description:
        'Total de lançamentos visíveis.',
      trend:
        filterCategory !== 'all'
          ? filterCategory
          : filterType === 'income'
            ? 'Receitas'
            : filterType === 'expense'
              ? 'Despesas'
              : 'Todas',
    },
  ];

  const selectedTransactions =
    useMemo(
      () =>
        filteredTransactions.filter(
          (transaction) =>
            selectedIds.includes(
              transaction.id,
            ),
        ),
      [
        filteredTransactions,
        selectedIds,
      ],
    );

  const selectedTotal =
    selectedTransactions.reduce(
      (acc, transaction) =>
        acc + transaction.value,
      0,
    );

  const allFilteredSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every(
      (transaction) =>
        selectedIds.includes(
          transaction.id,
        ),
    );

  function handleToggleTransactionSelection(
    id: number,
  ) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter(
            (itemId) =>
              itemId !== id,
          )
        : [
            ...prev,
            id,
          ],
    );
  }

  function handleToggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) =>
            !filteredTransactions.some(
              (transaction) =>
                transaction.id === id,
            ),
        ),
      );

      return;
    }

    setSelectedIds((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...filteredTransactions.map(
            (transaction) =>
              transaction.id,
          ),
        ]),
      ),
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      return;
    }

    setIsDeleting(true);

    try {
      await removeTransactions(
        selectedIds,
      );

      clearSelection();
      setShowBulkDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleExportCSV() {
    const rows =
      filteredTransactions.map(
        (transaction) => ({
          Titulo:
            transaction.title,

          Categoria:
            transaction.category,

          Tipo:
            transaction.type ===
            'income'
              ? 'Receita'
              : 'Despesa',

          Valor:
            transaction.value,

          Data:
            new Date(
              transaction.date,
            ).toLocaleDateString(
              'pt-BR',
            ),
        }),
      );

    exportToCSV(
      'transacoes',
      rows,
    );

    toast.success(
      'CSV exportado com sucesso!',
    );
  }

  return (
    <div className="transactions-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Transações
        </h1>

        <p className="dashboard-subtitle">
          Gerencie todas as suas receitas e despesas.
        </p>
      </div>

      <div className="kpi-grid transactions-kpi-grid">
        {transactionKpis.map(
          (item) => (
            <KPICard
              key={item.label}
              label={item.label}
              value={item.value}
              variant={item.variant}
              description={
                item.description
              }
              trend={item.trend}
            />
          ),
        )}
      </div>

      <Card
        title="Todas as Transações"
        subtitle="Busque, filtre, edite ou exporte seus lançamentos."
      >
        <div className="transactions-panel-summary">
          <span>
            Mostrando {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1
              ? 'transação'
              : 'transações'}
          </span>

          {hasActiveFilters && (
            <strong>
              Filtros aplicados
            </strong>
          )}
        </div>

        <div className="filters-wrapper transactions-filters">
          <input
            type="text"
            placeholder="Buscar transação..."
            className="search-input transactions-search-input"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
          />

          <div className="transactions-select-wrapper">
            <select
              className="filter-select transactions-filter-select"
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value as
                    | 'all'
                    | TransactionType,
                )
              }
            >
              <option value="all">
                Todas
              </option>

              <option value="income">
                Receitas
              </option>

              <option value="expense">
                Despesas
              </option>
            </select>

            <ChevronDown
              className="transactions-select-icon"
              size={18}
            />
          </div>

          <div className="transactions-select-wrapper">
            <select
              className="filter-select transactions-filter-select"
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(
                  e.target.value,
                )
              }
            >
              <option value="all">
                Todas categorias
              </option>

              {categoryOptions.map(
                (categoryOption) => (
                  <option
                    key={categoryOption}
                    value={categoryOption}
                  >
                    {categoryOption}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              className="transactions-select-icon"
              size={18}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="secondary-btn transactions-clear-btn"
              onClick={() => {
                setSearch('');
                setFilterType('all');
                setFilterCategory('all');
              }}
            >
              Limpar filtros
            </button>
          )}

          <button
            className="secondary-btn transactions-export-btn"
            onClick={handleExportCSV}
          >
            Exportar CSV
          </button>

          <button
            className="primary-btn transactions-add-btn"
            onClick={
              handleNewTransaction
            }
          >
            + Nova transação
          </button>
        </div>

        {!isLoading &&
          filteredTransactions.length > 0 && (
            <div
              className={`transactions-selection-bar ${
                selectedIds.length > 0
                  ? 'has-selection'
                  : ''
              }`}
            >
              <label className="transactions-select-all">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={
                    handleToggleSelectAllFiltered
                  }
                />

                <span>
                  {allFilteredSelected
                    ? 'Desmarcar todas filtradas'
                    : 'Selecionar todas filtradas'}
                </span>
              </label>

              {selectedIds.length > 0 && (
                <div className="transactions-bulk-actions">
                  <div className="transactions-bulk-info">
                    <span className="transactions-bulk-chip">
                      {selectedIds.length} selecionada(s)
                    </span>

                    <span className="transactions-bulk-chip">
                      Total: {formatMoney(selectedTotal)}
                    </span>
                  </div>

                  <div className="transactions-bulk-buttons">
                    <button
                      type="button"
                      className="transactions-bulk-clear-btn"
                      onClick={clearSelection}
                    >
                      Limpar
                    </button>

                    <button
                      type="button"
                      className="transactions-bulk-delete-btn"
                      onClick={() =>
                        setShowBulkDeleteModal(
                          true,
                        )
                      }
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {isLoading ? (
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="skeleton-card"
              >
                <div className="skeleton skeleton-icon" />

                <div className="skeleton-stack">
                  <div className="skeleton skeleton-line medium" />
                  <div className="skeleton skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon="📊"
            title="Nenhuma transação encontrada"
            description={
              transactions.length === 0
                ? 'Adicione sua primeira receita ou despesa para começar a acompanhar sua vida financeira.'
                : 'Nenhum resultado corresponde aos filtros atuais. Ajuste a busca ou limpe os filtros para visualizar suas transações.'
            }
            actionLabel={
              transactions.length === 0
                ? '+ Nova transação'
                : undefined
            }
            onAction={
              transactions.length === 0
                ? handleNewTransaction
                : undefined
            }
          />
        ) : (
          <TransactionsList
            transactions={filteredTransactions}
            selectedIds={selectedIds}
            onToggleSelect={
              handleToggleTransactionSelection
            }
            onEdit={handleEditTransaction}
            onDelete={setDeleteId}
          />
        )}
      </Card>

      <TransactionModal
        showModal={showModal}
        editId={editId}
        title={title}
        value={formattedValue}
        type={type}
        category={category}
        date={date}
        categories={categories}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving)
            return;

          setShowModal(false);
          setEditId(null);
        }}
        onTitleChange={setTitle}
        onValueChange={
          handleValueChange
        }
        onTypeChange={setType}
        onCategoryChange={
          setCategory
        }
        onDateChange={setDate}
        onSave={() =>
          editId
            ? handleSaveEditedTransaction()
            : handleAddTransaction()
        }
      />

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Excluir transação?"
        description="Essa ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={isDeleting}
        onCancel={() =>
          setDeleteId(null)
        }
        onConfirm={() => {
          if (deleteId) {
            handleRemoveTransaction(
              deleteId,
            );
          }
        }}
      />

      <ConfirmModal
        open={showBulkDeleteModal}
        title="Excluir transações selecionadas?"
        description={`Você está prestes a excluir ${selectedIds.length} transação(ões). Essa ação não pode ser desfeita.`}
        confirmText="Excluir selecionadas"
        cancelText="Cancelar"
        loading={isDeleting}
        onCancel={() =>
          setShowBulkDeleteModal(false)
        }
        onConfirm={handleBulkDelete}
      />

      <ConfirmModal
        open={Boolean(pendingPlanSuggestion)}
        title="Vincular ao planejamento?"
        description={
          pendingPlanSuggestion
            ? `Essa transação parece corresponder ao item "${pendingPlanSuggestion.item.title}" do Planejamento Mensal. Deseja marcar como ${pendingPlanSuggestion.item.type === 'income' ? 'recebido' : 'pago'} e vincular essa transação?`
            : ''
        }
        confirmText="Vincular"
        cancelText="Agora não"
        onCancel={() =>
          setPendingPlanSuggestion(null)
        }
        onConfirm={
          handleLinkTransactionToPlan
        }
      />

    </div>
  );
}
