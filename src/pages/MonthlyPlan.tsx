import {
    useEffect,
    useMemo,
    useState,
  } from 'react';
  
  import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    Plus,
    Receipt,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
  } from 'lucide-react';
  
  import Card from '../components/Card';
  import EmptyState from '../components/EmptyState';
  
  import MonthlyPlanItemCard from '../components/planning/MonthlyPlanItemCard';
  
  import {
    createMonthlyPlanItem,
    deleteMonthlyPlanItem,
    listMonthlyPlanItems,
    toggleMonthlyPlanItemPaid,
    } from '../services/monthlyPlanService';
  
  import {
    formatMoney,
  } from '../utils/format';
  
  import {
    useTransactions,
  } from '../hook/useTransactions';
  
  import type {
    Transaction,
  } from '../types/transaction';
  
  import type {
    MonthlyPlanItem,
    MonthlyPlanItemInput,
    MonthlyPlanItemType,
  } from '../types/monthlyPlan';
  
  const currentDate =
    new Date();
  
  const monthNames =
    Array.from({ length: 12 }, (_, index) =>
      new Date(
        2026,
        index,
        1,
      ).toLocaleDateString('pt-BR', {
        month: 'long',
      }),
    );
  
  const compactMonthNames =
    Array.from({ length: 12 }, (_, index) =>
      new Date(
        2026,
        index,
        1,
      ).toLocaleDateString('pt-BR', {
        month: 'short',
      }),
    );
  
  function getDateValue({
    year,
    month,
    day,
  }: {
    year: number;
    month: number;
    day: number;
  }) {
    return `${year}-${String(month).padStart(
      2,
      '0',
    )}-${String(day).padStart(2, '0')}`;
  }
  
  function getDefaultFormState({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): MonthlyPlanItemInput {
    return {
      month,
      year,
      title: '',
      type: 'fixed_expense',
      amount: 0,
      dueDate: getDateValue({
        year,
        month,
        day: 1,
      }),
      paid: false,
    };
  }
  
  function getMonthBounds({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) {
    const start =
      new Date(year, month - 1, 1);
  
    const end =
      new Date(year, month, 0);
  
    return {
      start,
      end,
    };
  }
  
  function isTransactionInMonth(
    transactionDate: string,
    {
      month,
      year,
    }: {
      month: number;
      year: number;
    },
  ) {
    const date =
      new Date(transactionDate);
  
    return (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month
    );
  }
  
  function getBudgetHealth({
    percentage,
  }: {
    percentage: number;
  }) {
    if (percentage <= 50) {
      return {
        label: 'Baixo comprometimento',
        tone: 'healthy',
      };
    }
  
    if (percentage <= 80) {
      return {
        label: 'Atenção ao orçamento',
        tone: 'warning',
      };
    }
  
    return {
      label: 'Orçamento pressionado',
      tone: 'critical',
    };
  }
  
  function getNextMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) {
    if (month === 12) {
      return {
        month: 1,
        year: year + 1,
      };
    }
  
    return {
      month: month + 1,
      year,
    };
  }
  
  function getPreviousMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) {
    if (month === 1) {
      return {
        month: 12,
        year: year - 1,
      };
    }
  
    return {
      month: month - 1,
      year,
    };
  }
  
  function getDueSoonItems(
    items: MonthlyPlanItem[],
  ) {
    return items
      .filter(
        (item) =>
          !item.paid &&
          Boolean(item.dueDate),
      )
      .sort(
        (a, b) =>
          new Date(
            `${a.dueDate}T12:00:00`,
          ).getTime() -
          new Date(
            `${b.dueDate}T12:00:00`,
          ).getTime(),
      )
      .slice(0, 3);
  }
  
  function formatDueDate(
    value: string | null,
  ) {
    if (!value) {
      return 'Sem data';
    }
  
    return new Date(
      `${value}T12:00:00`,
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }
  
  function getDaysUntilDue(
    value: string | null,
  ) {
    if (!value) {
      return null;
    }
  
    const today =
      new Date();
  
    today.setHours(0, 0, 0, 0);
  
    const dueDate =
      new Date(`${value}T12:00:00`);
  
    dueDate.setHours(0, 0, 0, 0);
  
    return Math.ceil(
      (dueDate.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }
  
  function getDueLabel(
    value: string | null,
  ) {
    const days =
      getDaysUntilDue(value);
  
    if (days === null) {
      return 'Sem vencimento';
    }
  
    if (days < 0) {
      return `Vencida há ${Math.abs(days)} dia(s)`;
    }
  
    if (days === 0) {
      return 'Vence hoje';
    }
  
    if (days === 1) {
      return 'Vence amanhã';
    }
  
    return `Vence em ${days} dias`;
  }
  
  function getDefaultTransactionCategory(
    item: MonthlyPlanItem,
  ) {
    if (item.type === 'income') {
      return 'Salário';
    }
  
    return 'Contas Fixas';
  }
  

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isSimilarTransactionTitle(
  planTitle: string,
  transactionTitle: string,
) {
  const normalizedPlan =
    normalizeText(planTitle);

  const normalizedTransaction =
    normalizeText(transactionTitle);

  if (
    normalizedPlan ===
    normalizedTransaction
  ) {
    return true;
  }

  return (
    normalizedPlan.includes(
      normalizedTransaction,
    ) ||
    normalizedTransaction.includes(
      normalizedPlan,
    )
  );
}

function findSimilarTransactionsForPlanItem({
  item,
  transactions,
}: {
  item: MonthlyPlanItem;
  transactions: Transaction[];
}) {
  const expectedType =
    item.type === 'income'
      ? 'income'
      : 'expense';

  return transactions.filter(
    (transaction) => {
      const sameType =
        transaction.type ===
        expectedType;

      const sameValue =
        Math.abs(
          transaction.value -
            item.amount,
        ) < 0.01;

      const similarTitle =
        isSimilarTransactionTitle(
          item.title,
          transaction.title,
        );

      return (
        sameType &&
        sameValue &&
        similarTitle
      );
    },
  );
}

  export default function MonthlyPlan() {
    const [
      selectedMonth,
      setSelectedMonth,
    ] = useState(
      currentDate.getMonth() + 1,
    );
  
    const [
      selectedYear,
      setSelectedYear,
    ] = useState(
      currentDate.getFullYear(),
    );
  
    const [
      monthPickerOpen,
      setMonthPickerOpen,
    ] = useState(false);
  
    const [
      items,
      setItems,
    ] = useState<MonthlyPlanItem[]>([]);
  
    const [
      isLoading,
      setIsLoading,
    ] = useState(true);
  
    const [
      isSaving,
      setIsSaving,
    ] = useState(false);
  
    const [
      itemToGenerateTransaction,
      setItemToGenerateTransaction,
    ] = useState<MonthlyPlanItem | null>(null);
  
    const [
      isGeneratingTransaction,
      setIsGeneratingTransaction,
    ] = useState(false);
  
    const [
      form,
      setForm,
    ] = useState<MonthlyPlanItemInput>(
      getDefaultFormState({
        month: selectedMonth,
        year: selectedYear,
      }),
    );
  
    const {
      transactions,
      addTransaction,
    } = useTransactions();
  
    useEffect(() => {
      setForm(
        getDefaultFormState({
          month: selectedMonth,
          year: selectedYear,
        }),
      );
    }, [selectedMonth, selectedYear]);
  
    useEffect(() => {
      async function loadItems() {
        try {
          setIsLoading(true);
  
          const response =
            await listMonthlyPlanItems({
              month: selectedMonth,
              year: selectedYear,
            });
  
          setItems(response);
        } finally {
          setIsLoading(false);
        }
      }
  
      loadItems();
    }, [selectedMonth, selectedYear]);
  
    const incomeItems =
      items.filter(
        (item) =>
          item.type === 'income',
      );
  
    const fixedExpenseItems =
      items.filter(
        (item) =>
          item.type === 'fixed_expense',
      );
  
    const monthlyTransactions =
      useMemo(
        () =>
          transactions.filter(
            (transaction) =>
              isTransactionInMonth(
                transaction.date,
                {
                  month: selectedMonth,
                  year: selectedYear,
                },
              ),
          ),
        [
          transactions,
          selectedMonth,
          selectedYear,
        ],
      );
  
    const variableExpensesByCategory =
      useMemo(() => {
        const fixedTitles =
          new Set(
            fixedExpenseItems.map((item) =>
              item.title
                .trim()
                .toLowerCase(),
            ),
          );
  
        const groups =
          new Map<
            string,
            {
              amount: number;
              count: number;
            }
          >();
  
        monthlyTransactions
          .filter(
            (transaction) =>
              transaction.type === 'expense',
          )
          .forEach((transaction) => {
            const normalizedTitle =
              transaction.title
                .trim()
                .toLowerCase();
  
            if (
              fixedTitles.has(
                normalizedTitle,
              )
            ) {
              return;
            }
  
            const current =
              groups.get(
                transaction.category,
              ) ?? {
                amount: 0,
                count: 0,
              };
  
            groups.set(
              transaction.category,
              {
                amount:
                  current.amount +
                  transaction.value,
                count:
                  current.count + 1,
              },
            );
          });
  
        return Array.from(
          groups.entries(),
        )
          .map(([category, data]) => ({
            category,
            amount: data.amount,
            count: data.count,
          }))
          .sort(
            (a, b) =>
              b.amount - a.amount,
          );
      }, [
        monthlyTransactions,
        fixedExpenseItems,
      ]);
  
    const expectedIncome =
      incomeItems.reduce(
        (acc, item) =>
          acc + item.amount,
        0,
      );
  
    const receivedIncome =
      incomeItems
        .filter((item) => item.paid)
        .reduce(
          (acc, item) =>
            acc + item.amount,
          0,
        );
  
    const pendingIncome =
      expectedIncome - receivedIncome;
  
    const fixedExpenses =
      fixedExpenseItems.reduce(
        (acc, item) =>
          acc + item.amount,
        0,
      );
  
    const paidFixedExpenses =
      fixedExpenseItems
        .filter((item) => item.paid)
        .reduce(
          (acc, item) =>
            acc + item.amount,
          0,
        );
  
    const pendingFixedExpenses =
      fixedExpenses - paidFixedExpenses;
  
    const variableExpenses =
      variableExpensesByCategory.reduce(
        (acc, item) =>
          acc + item.amount,
        0,
      );
  
    const committedAmount =
      fixedExpenses + variableExpenses;
  
    const projectedBalance =
      expectedIncome - committedAmount;
  
    const committedPercentage =
      expectedIncome > 0
        ? Math.min(
            100,
            Math.round(
              (committedAmount /
                expectedIncome) *
                100,
            ),
          )
        : 0;
  
    const incomeProgress =
      expectedIncome > 0
        ? Math.round(
            (receivedIncome /
              expectedIncome) *
              100,
          )
        : 0;
  
    const fixedExpenseProgress =
      fixedExpenses > 0
        ? Math.round(
            (paidFixedExpenses /
              fixedExpenses) *
              100,
          )
        : 0;
  
    const budgetHealth =
      getBudgetHealth({
        percentage:
          committedPercentage,
      });
  
    const dueSoonItems =
      getDueSoonItems(
        fixedExpenseItems,
      );
  
    const actualIncome =
      monthlyTransactions
        .filter(
          (transaction) =>
            transaction.type === 'income',
        )
        .reduce(
          (acc, transaction) =>
            acc + transaction.value,
          0,
        );
  
    const actualExpenses =
      monthlyTransactions
        .filter(
          (transaction) =>
            transaction.type === 'expense',
        )
        .reduce(
          (acc, transaction) =>
            acc + transaction.value,
          0,
        );
  
    const expectedExpenseTotal =
      fixedExpenses + variableExpenses;
  
    const actualBalance =
      actualIncome - actualExpenses;
  
    const fixedPaidCount =
      fixedExpenseItems.filter(
        (item) => item.paid,
      ).length;
  
    const fixedPendingCount =
      fixedExpenseItems.length -
      fixedPaidCount;
  
    const monthSituationLabel =
      pendingIncome <= 0 &&
      pendingFixedExpenses <= 0
        ? 'Mês fechado'
        : 'Mês em andamento';
  
    const monthSituationDescription =
      pendingIncome > 0
        ? `Ainda faltam ${formatMoney(pendingIncome)} em receitas previstas.`
        : pendingFixedExpenses > 0
          ? `Ainda faltam ${formatMoney(pendingFixedExpenses)} em despesas fixas.`
          : 'Todas as receitas e contas fixas previstas foram concluídas.';
  
    async function handleCreateItem(
      event: React.FormEvent,
    ) {
      event.preventDefault();
  
      if (!form.title.trim()) {
        return;
      }
  
      try {
        setIsSaving(true);
  
        const created =
          await createMonthlyPlanItem({
            ...form,
            month: selectedMonth,
            year: selectedYear,
            amount: Number(form.amount),
          });
  
        setItems((current) => [
          ...current,
          created,
        ]);
  
        setForm(
          getDefaultFormState({
            month: selectedMonth,
            year: selectedYear,
          }),
        );
      } finally {
        setIsSaving(false);
      }
    }
  
    async function markItemPaid(
      item: MonthlyPlanItem,
      paid: boolean,
      transactionId?: number | null,
    ) {
      const updated =
        await toggleMonthlyPlanItemPaid({
          id: item.id,
          paid,
          transactionId: paid
            ? transactionId ?? item.transactionId ?? null
            : null,
        });
  
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? updated
            : currentItem,
        ),
      );
  
      return updated;
    }
  
    async function handleTogglePaid(
      item: MonthlyPlanItem,
    ) {
      if (item.paid) {
        await markItemPaid(
          item,
          false,
        );
  
        return;
      }
  
      setItemToGenerateTransaction(
        item,
      );
    }
  
    async function handleOnlyMarkPaid() {
      if (!itemToGenerateTransaction) {
        return;
      }
  
      await markItemPaid(
        itemToGenerateTransaction,
        true,
      );
  
      setItemToGenerateTransaction(null);
    }
  
    async function handleLinkExistingTransaction(
      transaction: Transaction,
    ) {
      if (!itemToGenerateTransaction) {
        return;
      }

      await markItemPaid(
        itemToGenerateTransaction,
        true,
        transaction.id,
      );

      setItemToGenerateTransaction(null);
    }

    async function handleGenerateTransactionAndMarkPaid() {
      if (!itemToGenerateTransaction) {
        return;
      }

      const similarTransactions =
        findSimilarTransactionsForPlanItem({
          item: itemToGenerateTransaction,
          transactions: monthlyTransactions,
        });

      if (similarTransactions.length > 0) {
        await handleLinkExistingTransaction(
          similarTransactions[0],
        );

        return;
      }
  
      try {
        setIsGeneratingTransaction(true);
  
        const transaction: Transaction = {
          id: Date.now(),
  
          title:
            itemToGenerateTransaction.title,
  
          value:
            itemToGenerateTransaction.amount,
  
          type:
            itemToGenerateTransaction.type ===
            'income'
              ? 'income'
              : 'expense',
  
          category:
            getDefaultTransactionCategory(
              itemToGenerateTransaction,
            ),
  
          date:
            itemToGenerateTransaction.dueDate ??
            new Date()
              .toISOString()
              .split('T')[0],
        };
  
        const createdTransaction =
          await addTransaction(transaction);

        if (!createdTransaction) {
          return;
        }
  
        await markItemPaid(
          itemToGenerateTransaction,
          true,
          createdTransaction.id,
        );
  
        setItemToGenerateTransaction(null);
      } finally {
        setIsGeneratingTransaction(false);
      }
    }
  
    async function handleDelete(
      item: MonthlyPlanItem,
    ) {
      await deleteMonthlyPlanItem(
        item.id,
      );
  
      setItems((current) =>
        current.filter(
          (currentItem) =>
            currentItem.id !== item.id,
        ),
      );
    }
  
    function handleFormChange(
      key: keyof MonthlyPlanItemInput,
      value: string | number | boolean,
    ) {
      setForm((current) => ({
        ...current,
        [key]: value,
      }));
    }
  
    function handlePreviousMonth() {
      const previous =
        getPreviousMonth({
          month: selectedMonth,
          year: selectedYear,
        });
  
      setSelectedMonth(previous.month);
      setSelectedYear(previous.year);
    }
  
    function handleNextMonth() {
      const next =
        getNextMonth({
          month: selectedMonth,
          year: selectedYear,
        });
  
      setSelectedMonth(next.month);
      setSelectedYear(next.year);
    }
  
    function handleSelectMonth(
      month: number,
    ) {
      setSelectedMonth(month);
      setMonthPickerOpen(false);
    }
  
    const {
      start,
      end,
    } = getMonthBounds({
      month: selectedMonth,
      year: selectedYear,
    });

    const similarTransactionsForSelected =
      itemToGenerateTransaction
        ? findSimilarTransactionsForPlanItem({
            item: itemToGenerateTransaction,
            transactions: monthlyTransactions,
          })
        : [];
  
    return (
      <div className="monthly-plan-page">
        <div className="dashboard-header monthly-plan-header">
          <div>
            <h1 className="dashboard-title">
              Planejamento Mensal
            </h1>
  
            <p className="dashboard-subtitle">
              Controle entradas previstas, contas fixas e gastos variáveis do mês em uma visão única.
            </p>
          </div>
  
          <div className="monthly-plan-period-premium">
            <button
              type="button"
              onClick={handlePreviousMonth}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={17} />
            </button>
  
            <div className="monthly-plan-month-selector">
              <button
                type="button"
                onClick={() =>
                  setMonthPickerOpen(
                    (current) => !current,
                  )
                }
              >
                <Calendar size={16} />
  
                <span>
                  {monthNames[
                    selectedMonth - 1
                  ]}
                </span>
  
                <strong>
                  {selectedYear}
                </strong>
              </button>
  
              {monthPickerOpen && (
                <div className="monthly-plan-month-popover">
                  <div className="monthly-plan-year-row">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedYear(
                          selectedYear - 1,
                        )
                      }
                    >
                      <ChevronLeft size={15} />
                    </button>
  
                    <strong>
                      {selectedYear}
                    </strong>
  
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedYear(
                          selectedYear + 1,
                        )
                      }
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
  
                  <div className="monthly-plan-month-grid">
                    {compactMonthNames.map(
                      (monthName, index) => (
                        <button
                          key={monthName}
                          type="button"
                          className={
                            selectedMonth ===
                            index + 1
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            handleSelectMonth(
                              index + 1,
                            )
                          }
                        >
                          {monthName}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
  
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
  
        <section className="monthly-plan-hero">
          <div>
            <span className="goal-eyebrow">
              Visão do mês
            </span>
  
            <h2>
              {monthNames[
                selectedMonth - 1
              ]}{' '}
              {selectedYear}
            </h2>
  
            <p>
              Período de{' '}
              {start.toLocaleDateString(
                'pt-BR',
              )}{' '}
              até{' '}
              {end.toLocaleDateString(
                'pt-BR',
              )}
            </p>
          </div>
  
          <div className="monthly-plan-hero-balance monthly-plan-free-balance">
            <span>
              Saldo livre do mês
            </span>
  
            <strong
              className={
                projectedBalance >= 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {formatMoney(
                projectedBalance,
              )}
            </strong>
  
            <small>
              Disponível para guardar, investir ou gastar sem comprometer o planejamento.
            </small>
  
            <div className="monthly-plan-free-actions">
              <span>Guardar</span>
              <span>Investir</span>
              <span>Gastar</span>
            </div>
          </div>
        </section>
  
        <section className="monthly-plan-kpis">
          <PlanKpi
            icon={<TrendingUp size={20} />}
            label="Receita prevista"
            value={formatMoney(expectedIncome)}
            description={`${formatMoney(receivedIncome)} recebido · ${incomeProgress}%`}
            tone="income"
          />
  
          <PlanKpi
            icon={<CreditCard size={20} />}
            label="Despesas fixas"
            value={formatMoney(fixedExpenses)}
            description={`${formatMoney(paidFixedExpenses)} pago · ${fixedExpenseProgress}%`}
            tone="expense"
          />
  
          <PlanKpi
            icon={<TrendingDown size={20} />}
            label="Variáveis do mês"
            value={formatMoney(variableExpenses)}
            description={
              variableExpenses > 0
                ? `${variableExpensesByCategory.length} categoria(s) identificada(s)`
                : 'Sem movimentações variáveis'
            }
            tone="variable"
          />
  
          <PlanKpi
            icon={<Wallet size={20} />}
            label="Disponível"
            value={formatMoney(projectedBalance)}
            description={`${committedPercentage}% comprometido`}
            tone="balance"
          />
        </section>
  
        <section
          className={`monthly-plan-budget-health ${budgetHealth.tone}`}
        >
          <div className="monthly-plan-budget-main">
            <span className="goal-eyebrow">
              Saúde do orçamento
            </span>
  
            <strong>
              {budgetHealth.label}
            </strong>
  
            <p>
              {committedPercentage}% do mês já está comprometido entre despesas fixas e gastos variáveis.
            </p>
          </div>
  
          <div className="monthly-plan-budget-side">
            <strong>
              {committedPercentage}%
            </strong>
  
            <div className="monthly-plan-progress">
              <div
                style={{
                  width: `${committedPercentage}%`,
                }}
              />
            </div>
          </div>
        </section>
  
        <section className="monthly-plan-breakdown-grid">
          <div className="monthly-plan-breakdown-card">
            <span>Receitas</span>
            <strong>
              {formatMoney(expectedIncome)}
            </strong>
          </div>
  
          <div className="monthly-plan-breakdown-card expense">
            <span>Despesas fixas</span>
            <strong>
              -{formatMoney(fixedExpenses)}
            </strong>
          </div>
  
          <div className="monthly-plan-breakdown-card expense">
            <span>Variáveis</span>
            <strong>
              -{formatMoney(variableExpenses)}
            </strong>
          </div>
  
          <div className="monthly-plan-breakdown-card balance">
            <span>Saldo previsto</span>
            <strong>
              {formatMoney(projectedBalance)}
            </strong>
          </div>
        </section>
  
        <section className="monthly-plan-closing-card monthly-plan-situation-card">
          <div className="monthly-plan-closing-header">
            <div>
              <span className="goal-eyebrow">
                Situação do mês
              </span>
  
              <strong>
                {monthSituationLabel}
              </strong>
            </div>
  
            <Receipt size={20} />
          </div>
  
          <p className="monthly-plan-situation-description">
            {monthSituationDescription}
          </p>
  
          <div className="monthly-plan-situation-grid">
            <SituationRow
              label="Receitas"
              planned={formatMoney(expectedIncome)}
              actual={formatMoney(actualIncome)}
              helper={`${incomeProgress}% recebido`}
              tone="income"
            />
  
            <SituationRow
              label="Despesas"
              planned={formatMoney(expectedExpenseTotal)}
              actual={formatMoney(actualExpenses)}
              helper={`${fixedExpenseProgress}% das fixas pagas`}
              tone="expense"
            />
  
            <SituationRow
              label="Saldo"
              planned={formatMoney(projectedBalance)}
              actual={formatMoney(actualBalance)}
              helper={
                actualBalance >= projectedBalance
                  ? 'Acima do previsto'
                  : 'Abaixo do previsto'
              }
              tone={
                actualBalance >= projectedBalance
                  ? 'income'
                  : 'expense'
              }
            />
          </div>
        </section>
  
        <form
          className="monthly-plan-form"
          onSubmit={handleCreateItem}
        >
          <div className="monthly-plan-form-grid">
            <label>
              <span>Título</span>
  
              <input
                value={form.title}
                onChange={(event) =>
                  handleFormChange(
                    'title',
                    event.target.value,
                  )
                }
                placeholder="Ex: Internet, Salário Lucas..."
              />
            </label>
  
            <label>
              <span>Tipo</span>
  
              <select
                value={form.type}
                onChange={(event) =>
                  handleFormChange(
                    'type',
                    event.target
                      .value as MonthlyPlanItemType,
                  )
                }
              >
                <option value="fixed_expense">
                  Despesa fixa
                </option>
  
                <option value="income">
                  Entrada prevista
                </option>
              </select>
            </label>
  
            <label>
              <span>Valor</span>
  
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  handleFormChange(
                    'amount',
                    Number(event.target.value),
                  )
                }
              />
            </label>
  
            <label>
              <span>Data</span>
  
              <input
                type="date"
                value={form.dueDate ?? ''}
                onChange={(event) =>
                  handleFormChange(
                    'dueDate',
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
  
          <button
            type="submit"
            className="primary-btn"
            disabled={isSaving}
          >
            <Plus size={18} />
            {isSaving
              ? 'Adicionando...'
              : 'Adicionar ao mês'}
          </button>
        </form>
  
        <section className="monthly-plan-grid">
          <Card
            title="Entradas previstas"
            subtitle={`${formatMoney(pendingIncome)} ainda não recebido · ${incomeProgress}% realizado.`}
          >
            {isLoading ? (
              <p className="dashboard-subtitle">
                Carregando...
              </p>
            ) : incomeItems.length === 0 ? (
              <EmptyState
                icon="💰"
                title="Nenhuma entrada prevista"
                description="Cadastre salários, adiantamentos, VRs ou qualquer receita prevista para o mês."
              />
            ) : (
              <div className="monthly-plan-list">
                {incomeItems.map((item) => (
                  <MonthlyPlanItemCard
                    key={item.id}
                    item={item}
                    onTogglePaid={
                      handleTogglePaid
                    }
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </Card>
  
          <Card
            title="Despesas fixas"
            subtitle={`${formatMoney(pendingFixedExpenses)} ainda pendente · ${fixedExpenseProgress}% pago.`}
          >
            {isLoading ? (
              <p className="dashboard-subtitle">
                Carregando...
              </p>
            ) : fixedExpenseItems.length === 0 ? (
              <EmptyState
                icon="📌"
                title="Nenhuma despesa fixa"
                description="Cadastre financiamentos, internet, planos e contas recorrentes do mês."
              />
            ) : (
              <div className="monthly-plan-list">
                <div className="monthly-plan-section-progress">
                  <div>
                    <strong>
                      {fixedPaidCount} pagas · {fixedPendingCount} pendentes
                    </strong>
  
                    <span>
                      {fixedExpenseProgress}% das contas fixas concluídas
                    </span>
                  </div>
  
                  <div className="monthly-plan-section-progress-track">
                    <div
                      style={{
                        width: `${fixedExpenseProgress}%`,
                      }}
                    />
                  </div>
                </div>
  
                {fixedExpenseItems.map((item) => (
                  <MonthlyPlanItemCard
                    key={item.id}
                    item={item}
                    onTogglePaid={
                      handleTogglePaid
                    }
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </Card>
  
          <Card
            title="Próximos vencimentos"
            subtitle="Top 3 contas pendentes mais próximas."
          >
            {dueSoonItems.length === 0 ? (
              <EmptyState
                icon="✅"
                title="Nenhuma conta pendente"
                description="Todas as contas fixas do mês foram pagas ou não há vencimentos cadastrados."
              />
            ) : (
              <div className="monthly-plan-due-list">
                {dueSoonItems.map((item) => (
                  <div
                    key={item.id}
                    className={`monthly-plan-due-row ${
                      (getDaysUntilDue(
                        item.dueDate,
                      ) ?? 99) <= 3
                        ? 'urgent'
                        : ''
                    }`}
                  >
                    <span className="monthly-plan-due-alert">
                      <AlertTriangle size={16} />
                    </span>
  
                    <div>
                      <strong>
                        {item.title}
                      </strong>
  
                      <span>
                        {getDueLabel(
                          item.dueDate,
                        )}{' '}
                        ·{' '}
                        {formatDueDate(
                          item.dueDate,
                        )}
                      </span>
                    </div>
  
                    <strong>
                      {formatMoney(item.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
  
          <Card
            title="Ranking de gastos variáveis"
            subtitle="Categorias fora das contas fixas, ordenadas por impacto."
          >
            {variableExpensesByCategory.length === 0 ? (
              <EmptyState
                icon="🧾"
                title="Nenhum gasto variável"
                description="Quando houver transações fora das contas fixas, elas aparecerão agrupadas aqui."
              />
            ) : (
              <div className="monthly-plan-variable-list">
                <div className="monthly-plan-variable-summary">
                  <span>Total variável</span>
  
                  <strong>
                    {formatMoney(variableExpenses)}
                  </strong>
                </div>
  
                {variableExpensesByCategory.map(
                  (item, index) => (
                    <div
                      key={item.category}
                      className="monthly-plan-variable-row"
                    >
                      <div>
                        <span className="monthly-plan-variable-rank">
                          #{index + 1}
                        </span>
  
                        <span className="monthly-plan-variable-icon">
                          <CircleDollarSign size={16} />
                        </span>
  
                        <div>
                          <strong>
                            {item.category}
                          </strong>
  
                          <small>
                            {item.count}{' '}
                            {item.count === 1
                              ? 'transação'
                              : 'transações'}
                          </small>
                        </div>
                      </div>
  
                      <span>
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>
        </section>
  
        {itemToGenerateTransaction && (
          <div className="monthly-plan-modal-backdrop">
            <div className="monthly-plan-transaction-modal">
              <button
                type="button"
                className="monthly-plan-modal-close"
                onClick={() =>
                  setItemToGenerateTransaction(
                    null,
                  )
                }
              >
                <X size={18} />
              </button>
  
              <div className="monthly-plan-modal-icon">
                <CheckCircle2 size={26} />
              </div>
  
              <h3>
                Marcar como{' '}
                {itemToGenerateTransaction.type ===
                'income'
                  ? 'recebido'
                  : 'pago'}
                ?
              </h3>
  
              <p>
                Você pode apenas atualizar o status ou criar automaticamente uma transação para manter o fluxo financeiro sincronizado.
              </p>
  
              <div className="monthly-plan-modal-preview">
                <span>
                  {itemToGenerateTransaction.title}
                </span>
  
                <strong>
                  {formatMoney(
                    itemToGenerateTransaction.amount,
                  )}
                </strong>
              </div>

              {similarTransactionsForSelected.length > 0 && (
                <div className="monthly-plan-similar-warning">
                  <strong>
                    Transação parecida encontrada
                  </strong>

                  <span>
                    Para evitar duplicidade, o MyFlow vai vincular a transação existente em vez de criar outra.
                  </span>

                  <div className="monthly-plan-similar-transaction">
                    <div>
                      <strong>
                        {similarTransactionsForSelected[0].title}
                      </strong>

                      <span>
                        {new Date(
                          similarTransactionsForSelected[0].date,
                        ).toLocaleDateString(
                          'pt-BR',
                        )}
                      </span>
                    </div>

                    <strong>
                      {formatMoney(
                        similarTransactionsForSelected[0].value,
                      )}
                    </strong>
                  </div>
                </div>
              )}
  
              <div className="monthly-plan-modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleOnlyMarkPaid}
                >
                  Só marcar status
                </button>
  
                <button
                  type="button"
                  className="primary-btn"
                  disabled={
                    isGeneratingTransaction
                  }
                  onClick={
                    handleGenerateTransactionAndMarkPaid
                  }
                >
                  {isGeneratingTransaction
                    ? 'Processando...'
                    : similarTransactionsForSelected.length > 0
                      ? 'Usar transação existente'
                      : 'Gerar transação'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  type PlanKpiProps = {
    icon: React.ReactNode;
  
    label: string;
  
    value: string;
  
    description: string;
  
    tone:
      | 'income'
      | 'expense'
      | 'variable'
      | 'balance';
  };
  
  function PlanKpi({
    icon,
    label,
    value,
    description,
    tone,
  }: PlanKpiProps) {
    return (
      <div className={`monthly-plan-kpi ${tone}`}>
        <div className="monthly-plan-kpi-top">
          <span>
            {icon}
          </span>
  
          <small>
            {label}
          </small>
        </div>
  
        <strong>
          {value}
        </strong>
  
        <p>
          {description}
        </p>
      </div>
    );
  }
  
  type SituationRowProps = {
    label: string;
  
    planned: string;
  
    actual: string;
  
    helper: string;
  
    tone: 'income' | 'expense';
  };
  
  function SituationRow({
    label,
    planned,
    actual,
    helper,
    tone,
  }: SituationRowProps) {
    return (
      <div className={`monthly-plan-situation-row ${tone}`}>
        <span>
          {label}
        </span>
  
        <strong>
          {actual}
        </strong>
  
        <small>
          Previsto: {planned}
        </small>
  
        <em>
          {helper}
        </em>
      </div>
    );
  }
