import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Download,
  Edit3,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';

import toast from 'react-hot-toast';

import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import Topbar from '../components/Topbar';
import TransactionModal from '../components/TransactionModal';

import { useTransactions } from '../hook/useTransactions';

import { exportToCSV } from '../utils/export';
import { formatMoney } from '../utils/format';

import type { Transaction, TransactionType } from '../types/transaction';

const baseCategories = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Moradia',
  'Salário',
  'Investimentos',
  'Outros',
];

type TypeFilter = 'all' | TransactionType;

type TransactionMetricTone = 'balance' | 'income' | 'expense' | 'movement';

type TransactionGroup = {
  key: string;
  title: string;
  subtitle: string;
  income: number;
  expense: number;
  transactions: Transaction[];
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatCurrency(input: string) {
  const numeric = input.replace(/\D/g, '');
  const value = Number(numeric) / 100;

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function getTodayInputValue() {
  const today = new Date();

  return `${today.getFullYear()}-${padDatePart(today.getMonth() + 1)}-${padDatePart(
    today.getDate(),
  )}`;
}

function parseDateParts(date: string) {
  const [dateOnly] = date.split('T');
  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function parseTransactionDate(date: string) {
  const parts = parseDateParts(date);

  if (!parts) {
    return new Date(date);
  }

  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
}

function getDateInputValue(date: string) {
  const parts = parseDateParts(date);

  if (!parts) {
    return getTodayInputValue();
  }

  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

function toStoredTransactionDate(date: string) {
  const parts = parseDateParts(date);

  if (!parts) {
    return new Date().toISOString();
  }

  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0).toISOString();
}

function getTransactionDateKey(date: string) {
  return getDateInputValue(date);
}

function getTypeLabel(type: TransactionType) {
  return type === 'income' ? 'Receita' : 'Despesa';
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(parseTransactionDate(date));
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(parseTransactionDate(date));
}

function formatGroupTitle(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseTransactionDate(date));
}

function formatGroupSubtitle(date: string, count: number) {
  const weekDay = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
  }).format(parseTransactionDate(date));

  return `${weekDay} · ${count} ${count === 1 ? 'movimentação' : 'movimentações'}`;
}

function sortTransactionsByDate(transactions: Transaction[]) {
  return [...transactions].sort(
    (firstTransaction, secondTransaction) =>
      parseTransactionDate(secondTransaction.date).getTime() -
      parseTransactionDate(firstTransaction.date).getTime(),
  );
}

function groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
  const grouped = new Map<string, Transaction[]>();

  sortTransactionsByDate(transactions).forEach((transaction) => {
    const key = getTransactionDateKey(transaction.date);
    const currentGroup = grouped.get(key) ?? [];

    grouped.set(key, [...currentGroup, transaction]);
  });

  return Array.from(grouped.entries()).map(([key, groupTransactions]) => {
    const income = groupTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.value, 0);

    const expense = groupTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.value, 0);

    return {
      key,
      title: formatGroupTitle(key),
      subtitle: formatGroupSubtitle(key, groupTransactions.length),
      income,
      expense,
      transactions: groupTransactions,
    };
  });
}

function getTotalByType(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.value, 0);
}

function getCategoryOptions(transactions: Transaction[]) {
  return Array.from(
    new Set([
      ...baseCategories,
      ...transactions.map((transaction) => transaction.category),
    ]),
  ).filter(Boolean);
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

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TypeFilter>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Outros');
  const [date, setDate] = useState(getTodayInputValue());

  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryOptions = useMemo(
    () => getCategoryOptions(transactions),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return transactions.filter((transaction) => {
      const normalizedTitle = normalizeText(transaction.title);
      const normalizedCategory = normalizeText(transaction.category);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizedTitle.includes(normalizedSearch) ||
        normalizedCategory.includes(normalizedSearch);

      const matchesType =
        filterType === 'all' ? true : transaction.type === filterType;

      const matchesCategory =
        filterCategory === 'all' ? true : transaction.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, filterType, filterCategory]);

  const filteredIncome = useMemo(
    () => getTotalByType(filteredTransactions, 'income'),
    [filteredTransactions],
  );

  const filteredExpense = useMemo(
    () => getTotalByType(filteredTransactions, 'expense'),
    [filteredTransactions],
  );

  const filteredBalance = filteredIncome - filteredExpense;

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  const selectedTransactions = useMemo(
    () =>
      filteredTransactions.filter((transaction) =>
        selectedIds.includes(transaction.id),
      ),
    [filteredTransactions, selectedIds],
  );

  const selectedTotal = selectedTransactions.reduce(
    (total, transaction) => total + transaction.value,
    0,
  );

  const hasActiveFilters =
    Boolean(search.trim()) || filterType !== 'all' || filterCategory !== 'all';

  const allFilteredSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((transaction) => selectedIds.includes(transaction.id));

  const transactionMetrics = [
    {
      title: 'Saldo filtrado',
      value: formatMoney(filteredBalance),
      description: 'Resultado das transações visíveis.',
      tone: 'balance' as const,
      icon: Wallet,
    },
    {
      title: 'Entradas',
      value: formatMoney(filteredIncome),
      description: 'Receitas encontradas no filtro.',
      tone: 'income' as const,
      icon: ArrowUpRight,
    },
    {
      title: 'Saídas',
      value: formatMoney(filteredExpense),
      description: 'Despesas encontradas no filtro.',
      tone: 'expense' as const,
      icon: ArrowDownLeft,
    },
    {
      title: 'Movimentações',
      value: String(filteredTransactions.length),
      description: 'Total de lançamentos visíveis.',
      tone: 'movement' as const,
      icon: ReceiptText,
    },
  ];

  function resetForm() {
    setTitle('');
    setValue('');
    setFormattedValue('');
    setType('expense');
    setCategory('Outros');
    setDate(getTodayInputValue());
  }

  function clearFilters() {
    setSearch('');
    setFilterType('all');
    setFilterCategory('all');
  }

  function handleNewTransaction() {
    setEditId(null);
    resetForm();
    setShowModal(true);
  }

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, '');
    const numericValue = Number(raw) / 100;

    setValue(String(numericValue));
    setFormattedValue(formatCurrency(raw));
  }


  async function handleAddTransaction() {
    const normalizedTitle = title.trim();
    const numericValue = Number(value);

    if (!normalizedTitle || numericValue <= 0) {
      return;
    }

    setIsSaving(true);

    try {
      const newTransaction: Transaction = {
        id: Date.now(),
        title: normalizedTitle,
        value: numericValue,
        type,
        category,
        date: toStoredTransactionDate(date),
      };

      await addTransaction(newTransaction);

      resetForm();
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditTransaction(id: number) {
    const transaction = transactions.find((item) => item.id === id);

    if (!transaction) {
      return;
    }

    setTitle(transaction.title);
    setValue(String(transaction.value));
    setFormattedValue(formatMoney(transaction.value));
    setType(transaction.type);
    setCategory(transaction.category);
    setDate(getDateInputValue(transaction.date));
    setEditId(id);
    setShowModal(true);
  }

  async function handleSaveEditedTransaction() {
    const normalizedTitle = title.trim();
    const numericValue = Number(value);

    if (!normalizedTitle || numericValue <= 0 || editId === null) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedTransaction: Transaction = {
        id: editId,
        title: normalizedTitle,
        value: numericValue,
        type,
        category,
        date: toStoredTransactionDate(date),
      };

      await updateTransaction(updatedTransaction);

      setEditId(null);
      resetForm();
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveTransaction(id: number) {
    setIsDeleting(true);

    try {
      await removeTransaction(id);

      setSelectedIds((currentIds) =>
        currentIds.filter((itemId) => itemId !== id),
      );

      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleToggleTransactionSelection(id: number) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id],
    );
  }

  function handleToggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((currentIds) =>
        currentIds.filter(
          (id) =>
            !filteredTransactions.some((transaction) => transaction.id === id),
        ),
      );

      return;
    }

    setSelectedIds((currentIds) =>
      Array.from(
        new Set([
          ...currentIds,
          ...filteredTransactions.map((transaction) => transaction.id),
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
      await removeTransactions(selectedIds);
      clearSelection();
      setShowBulkDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleExportCSV() {
    const rows = filteredTransactions.map((transaction) => ({
      Titulo: transaction.title,
      Categoria: transaction.category,
      Tipo: transaction.type === 'income' ? 'Receita' : 'Despesa',
      Valor: transaction.value,
      Data: formatFullDate(transaction.date),
    }));

    exportToCSV('transacoes', rows);
    toast.success('CSV exportado com sucesso!');
  }

  function closeTransactionModal() {
    if (isSaving) {
      return;
    }

    setShowModal(false);
    setEditId(null);
  }

  return (
    <div className="transactions-premium-page">
      <Topbar onNewTransaction={handleNewTransaction} />

      <section className="transactions-page-header">
        <div>
          <span className="transactions-eyebrow">Controle financeiro</span>

          <h1>Transações</h1>

          <p>
            Organize receitas e despesas, revise lançamentos e mantenha seu
            histórico financeiro em dia.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn transactions-header-action"
          onClick={handleNewTransaction}
        >
          <Plus size={18} />
          Nova transação
        </button>
      </section>

      <section className="transactions-metric-grid">
        {transactionMetrics.map((metric) => (
          <TransactionMetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            tone={metric.tone}
            icon={metric.icon}
          />
        ))}
      </section>

      <section className="transactions-panel">
        <div className="transactions-panel-header">
          <div>
            <h2>Todas as transações</h2>

            <p>
              {filteredTransactions.length}{' '}
              {filteredTransactions.length === 1
                ? 'movimentação encontrada'
                : 'movimentações encontradas'}
              {hasActiveFilters ? ' com os filtros atuais.' : '.'}
            </p>
          </div>

          <div className="transactions-panel-actions">
            {hasActiveFilters && (
              <button
                type="button"
                className="secondary-btn"
                onClick={clearFilters}
              >
                Limpar filtros
              </button>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={handleExportCSV}
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="transactions-toolbar">
          <label className="transactions-search-field">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="transactions-select-field">
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value as TypeFilter)}
            >
              <option value="all">Todas</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>

            <ChevronDown size={17} />
          </div>

          <div className="transactions-select-field">
            <select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
            >
              <option value="all">Todas categorias</option>

              {categoryOptions.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </select>

            <ChevronDown size={17} />
          </div>
        </div>

        {!isLoading && filteredTransactions.length > 0 && (
          <div
            className={`transactions-selection-panel ${
              selectedIds.length > 0 ? 'active' : ''
            }`}
          >
            <label>
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={handleToggleSelectAllFiltered}
              />

              <span>
                {allFilteredSelected
                  ? 'Desmarcar transações filtradas'
                  : 'Selecionar transações filtradas'}
              </span>
            </label>

            {selectedIds.length > 0 && (
              <div className="transactions-bulk-panel">
                <span>{selectedIds.length} selecionada(s)</span>
                <span>Total: {formatMoney(selectedTotal)}</span>

                <button type="button" onClick={clearSelection}>
                  Limpar
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => setShowBulkDeleteModal(true)}
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="transactions-loading-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="transactions-loading-row">
                <div />
                <span />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon="💳"
            title="Nenhuma transação encontrada"
            description={
              transactions.length === 0
                ? 'Adicione sua primeira receita ou despesa para começar a acompanhar sua vida financeira.'
                : 'Nenhum resultado corresponde aos filtros atuais. Ajuste a busca ou limpe os filtros.'
            }
            actionLabel={transactions.length === 0 ? '+ Nova transação' : undefined}
            onAction={transactions.length === 0 ? handleNewTransaction : undefined}
          />
        ) : (
          <div className="transactions-date-groups">
            {groupedTransactions.map((group) => (
              <section key={group.key} className="transactions-date-group-card">
                <header className="transactions-date-header">
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.subtitle}</p>
                  </div>

                  <div className="transactions-date-totals">
                    {group.income > 0 && <span>+{formatMoney(group.income)}</span>}
                    {group.expense > 0 && <strong>-{formatMoney(group.expense)}</strong>}
                  </div>
                </header>

                <div className="transactions-row-list">
                  {group.transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      selected={selectedIds.includes(transaction.id)}
                      onToggleSelect={handleToggleTransactionSelection}
                      onEdit={handleEditTransaction}
                      onDelete={setDeleteId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <TransactionModal
        showModal={showModal}
        editId={editId}
        title={title}
        value={formattedValue}
        type={type}
        category={category}
        date={date}
        categories={categoryOptions}
        isSaving={isSaving}
        onClose={closeTransactionModal}
        onTitleChange={setTitle}
        onValueChange={handleValueChange}
        onTypeChange={setType}
        onCategoryChange={setCategory}
        onDateChange={setDate}
        onSave={() =>
          editId !== null ? handleSaveEditedTransaction() : handleAddTransaction()
        }
      />

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Excluir transação?"
        description="Essa ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) {
            handleRemoveTransaction(deleteId);
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
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />    </div>
  );
}

type TransactionMetricCardProps = {
  title: string;
  value: string;
  description: string;
  tone: TransactionMetricTone;
  icon: LucideIcon;
};

function TransactionMetricCard({
  title,
  value,
  description,
  tone,
  icon: Icon,
}: TransactionMetricCardProps) {
  return (
    <article className={`transactions-metric-card ${tone}`}>
      <div className="transactions-metric-icon">
        <Icon size={18} />
      </div>

      <span>{title}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

type TransactionRowProps = {
  transaction: Transaction;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

function TransactionRow({
  transaction,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income';

  return (
    <div className={`transactions-row ${selected ? 'selected' : ''}`}>
      <label className="transactions-row-check">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(transaction.id)}
        />
      </label>

      <div className={`transactions-row-icon ${transaction.type}`}>
        {isIncome ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
      </div>

      <div className="transactions-row-main">
        <strong>{transaction.title}</strong>

        <p>
          <span>{transaction.category}</span>
          {getTypeLabel(transaction.type)} · {formatShortDate(transaction.date)}
        </p>
      </div>

      <strong className={`transactions-row-value ${transaction.type}`}>
        {isIncome ? '+' : '-'}
        {formatMoney(transaction.value)}
      </strong>

      <div className="transactions-row-actions">
        <button
          type="button"
          aria-label="Editar transação"
          onClick={() => onEdit(transaction.id)}
        >
          <Edit3 size={15} />
        </button>

        <button
          type="button"
          className="danger"
          aria-label="Excluir transação"
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
