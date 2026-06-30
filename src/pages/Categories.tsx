import { AlertTriangle } from 'lucide-react';

import Card from '../components/Card';

import { useTransactions } from '../hook/useTransactions';

import { formatMoney } from '../utils/format';

import { exportToCSV } from '../utils/export';

export default function Categories() {
  const { transactions } =
    useTransactions();

  const categoryMap = new Map<
    string,
    {
      total: number;
      count: number;
      biggest: number;
    }
  >();

  transactions
    .filter(
      (transaction) =>
        transaction.type ===
        'expense',
    )
    .forEach((transaction) => {
      const current =
        categoryMap.get(
          transaction.category,
        ) || {
          total: 0,
          count: 0,
          biggest: 0,
        };

      categoryMap.set(
        transaction.category,
        {
          total:
            current.total +
            transaction.value,

          count:
            current.count + 1,

          biggest:
            transaction.value >
            current.biggest
              ? transaction.value
              : current.biggest,
        },
      );
    });

  const totalExpenses =
    Array.from(
      categoryMap.values(),
    ).reduce(
      (acc, item) =>
        acc + item.total,
      0,
    );

  const categories =
    Array.from(
      categoryMap.entries(),
    )
      .map(([name, data]) => {
        const percentage =
          totalExpenses > 0
            ? (data.total /
                totalExpenses) *
              100
            : 0;

        return {
          name,
          ...data,
          percentage,
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total,
      );

  const mainCategory =
    categories[0];

  function handleExportCSV() {
    const rows =
      categories.map(
        (category) => ({
          Categoria:
            category.name,

          Total:
            category.total,

          Percentual:
            `${category.percentage.toFixed(
              1,
            )}%`,

          Transacoes:
            category.count,

          MaiorDespesa:
            category.biggest,
        }),
      );

    exportToCSV(
      'categorias',
      rows,
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Categorias
        </h1>

        <p className="dashboard-subtitle">
          Analise onde estão concentrados seus maiores gastos.
        </p>
      </div>

      {mainCategory && (
        <div className="category-highlight">
          <div>
            <span className="category-highlight-badge">
              <AlertTriangle size={14} />

              Maior gasto
            </span>

            <h2>
              {mainCategory.name}
            </h2>

            <p>
              Esta categoria representa{' '}
              <strong>
                {mainCategory.percentage.toFixed(
                  1,
                )}
                %
              </strong>{' '}
              do total de despesas.
            </p>
          </div>

          <div className="category-highlight-value">
            {formatMoney(
              mainCategory.total,
            )}
          </div>
        </div>
      )}

      <Card title="Resumo por Categoria">
        <div className="filters-wrapper">
          <button
            className="secondary-btn"
            onClick={
              handleExportCSV
            }
          >
            Exportar CSV
          </button>
        </div>

        <div className="category-list">
          {categories.map(
            (item, index) => (
              <div
                key={item.name}
                className={`category-row ${
                  index === 0
                    ? 'is-main'
                    : ''
                } ${
                  index === 0
                    ? 'top-1'
                    : index === 1
                      ? 'top-2'
                      : index === 2
                        ? 'top-3'
                        : ''
                }`}
              >
                <div className="category-row-content">
                  <div className="category-row-header">
                    <div>
                      <span className="transaction-title">
                        {item.name}
                      </span>

                      <div className="transaction-meta">
                        <span className="transaction-date">
                          {item.count}{' '}
                          transações
                        </span>

                        <span className="category-badge">
                          Maior:{' '}
                          {formatMoney(
                            item.biggest,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="category-row-value">
                      <strong>
                        {formatMoney(
                          item.total,
                        )}
                      </strong>

                      <span>
                        {item.percentage.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="category-progress">
                    <div
                      className={`category-progress-fill ${
                        item.percentage >=
                        50
                          ? 'critical'
                          : item.percentage >=
                              30
                            ? 'warning'
                            : 'healthy'
                      }`}
                      style={{
                        width: `${Math.min(
                          item.percentage,
                          96,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ),
          )}

          {categories.length === 0 && (
            <div className="empty-state">
              <strong>
                Nenhuma categoria encontrada
              </strong>

              <span>
                Cadastre despesas para visualizar a distribuição por categoria.
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}