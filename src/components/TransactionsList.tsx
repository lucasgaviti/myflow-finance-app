import {
  Pencil,
  Trash2,
  PlusCircle,
  UtensilsCrossed,
  Fuel,
  Car,
  ShoppingCart,
  HeartPulse,
  Briefcase,
  Home,
  CircleDollarSign,
  Gamepad2,
  PiggyBank,
  Tag,
  MoreHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

import {
  useState,
} from 'react';

import { formatMoney } from '../utils/format';

import type {
  Transaction,
} from '../types/transaction';

type Props = {
  transactions: Transaction[];

  selectedIds?: number[];

  onToggleSelect?: (id: number) => void;

  onEdit: (id: number) => void;

  onDelete: (id: number) => void;
};

type TransactionGroup = {
  key: string;

  label: string;

  meta: string;

  transactions: Transaction[];

  income: number;

  expense: number;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseTransactionDate(date: string) {
  return new Date(date);
}

function getDateKey(date: string) {
  return parseTransactionDate(date)
    .toISOString()
    .split('T')[0];
}

function isSameDate(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function getGroupLabel(dateKey: string) {
  const date =
    new Date(`${dateKey}T12:00:00`);

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    today.getDate() - 1,
  );

  if (
    isSameDate(date, today)
  ) {
    return 'Hoje';
  }

  if (
    isSameDate(date, yesterday)
  ) {
    return 'Ontem';
  }

  return date.toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  );
}

function getGroupMeta(
  dateKey: string,
  count: number,
) {
  const date =
    new Date(`${dateKey}T12:00:00`);

  const weekday =
    date.toLocaleDateString(
      'pt-BR',
      {
        weekday: 'long',
      },
    );

  return `${weekday} • ${count} ${
    count === 1
      ? 'movimentação'
      : 'movimentações'
  }`;
}

function formatCompactDate(date: string) {
  return parseTransactionDate(date).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
    },
  );
}

function groupTransactionsByDate(
  transactions: Transaction[],
): TransactionGroup[] {
  const groups = new Map<
    string,
    TransactionGroup
  >();

  transactions.forEach((transaction) => {
    const key =
      getDateKey(transaction.date);

    const currentGroup =
      groups.get(key) ?? {
        key,

        label:
          getGroupLabel(key),

        meta: '',

        transactions: [],

        income: 0,

        expense: 0,
      };

    currentGroup.transactions.push(
      transaction,
    );

    if (transaction.type === 'income') {
      currentGroup.income +=
        transaction.value;
    } else {
      currentGroup.expense +=
        transaction.value;
    }

    currentGroup.meta =
      getGroupMeta(
        key,
        currentGroup.transactions.length,
      );

    groups.set(key, currentGroup);
  });

  return Array.from(groups.values()).sort(
    (a, b) =>
      new Date(b.key).getTime() -
      new Date(a.key).getTime(),
  );
}

function getCategoryIcon(
  category: string,
) {
  const normalized =
    normalizeText(category);

  if (
    normalized.includes('aliment') ||
    normalized.includes('ifood') ||
    normalized.includes('restaurante')
  ) {
    return <UtensilsCrossed size={12} />;
  }

  if (
    normalized.includes('combust') ||
    normalized.includes('posto')
  ) {
    return <Fuel size={12} />;
  }

  if (
    normalized.includes('transport') ||
    normalized.includes('pedagio') ||
    normalized.includes('uber')
  ) {
    return <Car size={12} />;
  }

  if (
    normalized.includes('mercado') ||
    normalized.includes('compras')
  ) {
    return <ShoppingCart size={12} />;
  }

  if (
    normalized.includes('saude') ||
    normalized.includes('farm') ||
    normalized.includes('drog')
  ) {
    return <HeartPulse size={12} />;
  }

  if (
    normalized.includes('salario') ||
    normalized.includes('receita')
  ) {
    return <Briefcase size={12} />;
  }

  if (
    normalized.includes('moradia') ||
    normalized.includes('aluguel') ||
    normalized.includes('energia') ||
    normalized.includes('internet')
  ) {
    return <Home size={12} />;
  }

  if (
    normalized.includes('lazer') ||
    normalized.includes('bar') ||
    normalized.includes('cinema')
  ) {
    return <Gamepad2 size={12} />;
  }

  if (
    normalized.includes('invest')
  ) {
    return <PiggyBank size={12} />;
  }

  if (
    normalized.includes('outros') ||
    normalized.includes('sem categoria')
  ) {
    return <Tag size={12} />;
  }

  return <CircleDollarSign size={12} />;
}

export default function TransactionsList({
  transactions,
  selectedIds = [],
  onToggleSelect,
  onEdit,
  onDelete,
}: Props) {
  const canSelect =
    Boolean(onToggleSelect);

  const [
    openActionsId,
    setOpenActionsId,
  ] = useState<number | null>(null);

  const groupedTransactions =
    groupTransactionsByDate(
      transactions,
    );

  function handleToggleActions(id: number) {
    setOpenActionsId((current) =>
      current === id ? null : id,
    );
  }

  function handleEdit(id: number) {
    setOpenActionsId(null);
    onEdit(id);
  }

  function handleDelete(id: number) {
    setOpenActionsId(null);
    onDelete(id);
  }

  return (
    <div className="transactions transactions-grouped transactions-senior">
      {groupedTransactions.map(
        (group) => (
          <section
            key={group.key}
            className="transaction-date-group"
          >
            <div className="transaction-date-group-header transaction-date-group-header-senior">
              <div className="transaction-date-title-block">
                <strong>
                  {group.label}
                </strong>

                <span>
                  {group.meta}
                </span>
              </div>

              <div className="transaction-date-group-summary">
                {group.income > 0 && (
                  <span className="income">
                    +{formatMoney(group.income)}
                  </span>
                )}

                {group.expense > 0 && (
                  <span className="expense">
                    -{formatMoney(group.expense)}
                  </span>
                )}
              </div>
            </div>

            <div className="transaction-date-group-list transaction-date-group-list-senior">
              {group.transactions.map(
                (item, index) => {
                  const isIncome =
                    item.type === 'income';

                  const isSelected =
                    selectedIds.includes(
                      item.id,
                    );

                  return (
                    <div
                      key={item.id}
                      className={`transaction-item transaction-item-senior ${
                        isSelected
                          ? 'transaction-item-selected'
                          : ''
                      }`}
                      style={{
                        animationDelay: `${index * 0.02}s`,
                      }}
                    >
                      <div className="transaction-main-senior">
                        {canSelect && (
                          <label
                            className="transaction-select-box"
                            title="Selecionar transação"
                          >
                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                onToggleSelect?.(
                                  item.id,
                                )
                              }
                            />
                          </label>
                        )}

                        <span
                          className={`transaction-type-icon transaction-type-icon-senior ${
                            isIncome
                              ? 'income'
                              : 'expense'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight
                              size={15}
                            />
                          ) : (
                            <ArrowDownLeft
                              size={15}
                            />
                          )}
                        </span>

                        <div className="transaction-info-senior">
                          <span className="transaction-title">
                            {item.title}
                          </span>

                          <div className="transaction-meta">
                            <span className="transaction-date">
                              {formatCompactDate(
                                item.date,
                              )}
                            </span>

                            <span className="transaction-meta-separator">
                              •
                            </span>

                            <span className="category-badge transaction-category-badge transaction-category-badge-muted">
                              {getCategoryIcon(
                                item.category,
                              )}

                              {item.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="transaction-side-senior">
                        <span
                          className={`transaction-value ${item.type}`}
                        >
                          {isIncome
                            ? '+'
                            : '-'}

                          {formatMoney(
                            item.value,
                          )}
                        </span>

                        <div className="transaction-menu-wrapper">
                          <button
                            className="transaction-menu-btn"
                            type="button"
                            onClick={() =>
                              handleToggleActions(
                                item.id,
                              )
                            }
                            title="Mais opções"
                            aria-label="Mais opções da transação"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openActionsId === item.id && (
                            <div className="transaction-actions-menu">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    item.id,
                                  )
                                }
                              >
                                <Pencil size={14} />
                                Editar
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  handleDelete(
                                    item.id,
                                  )
                                }
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        ),
      )}

      {transactions.length === 0 && (
        <div className="empty-state transaction-empty-state">
          <PlusCircle size={38} />

          <strong>
            Nenhuma transação encontrada
          </strong>

          <span>
            Tente ajustar os filtros ou cadastre uma nova movimentação para começar sua análise.
          </span>
        </div>
      )}
    </div>
  );
}
