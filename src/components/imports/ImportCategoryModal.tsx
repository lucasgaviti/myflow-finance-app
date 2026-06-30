import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Ban,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Wand2,
} from 'lucide-react';

import type {
  ImportReviewItem,
} from '../../types/importReview';

type Props = {
  category: string | null;

  items: ImportReviewItem[];

  categories: string[];

  onClose: () => void;

  onChange: (items: ImportReviewItem[]) => void;
};

const confidenceLabels = {
  high: 'Alta confiança',
  medium: 'Média confiança',
  low: 'Baixa confiança',
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value: string) {
  return new Date(
    `${value}T12:00:00`,
  ).toLocaleDateString('pt-BR');
}

function getConfidenceScore(
  confidence: ImportReviewItem['confidence'],
) {
  if (confidence === 'high') return 100;

  if (confidence === 'medium') return 70;

  return 35;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isInvalidCategory(
  value: string | null | undefined,
) {
  const normalized =
    value?.trim();

  return (
    !normalized ||
    normalized === '-' ||
    normalized.toLowerCase() ===
      'undefined' ||
    normalized.toLowerCase() === 'null'
  );
}

function getSafeCategory({
  value,
  fallback,
}: {
  value: string | null | undefined;
  fallback: string;
}) {
  if (isInvalidCategory(value)) {
    return fallback;
  }

  return value.trim();
}

export default function ImportCategoryModal({
  category,
  items,
  categories,
  onClose,
  onChange,
}: Props) {
  const [search, setSearch] =
    useState('');

  const [
    onlyNeedsReview,
    setOnlyNeedsReview,
  ] = useState(false);

  const modalCategory =
    category ?? 'Sem categoria';

  useEffect(() => {
    if (!category) return;

    const normalizedItems =
      items.map((item) => {
        const belongsToOpenCategory =
          item.selectedCategory === category ||
          (category === 'Sem categoria' &&
            isInvalidCategory(
              item.selectedCategory,
            ));

        if (!belongsToOpenCategory) {
          return item;
        }

        const safeSelectedCategory =
          getSafeCategory({
            value:
              item.selectedCategory,
            fallback:
              category,
          });

        const safeSuggestedCategory =
          getSafeCategory({
            value:
              item.suggestedCategory,
            fallback:
              safeSelectedCategory,
          });

        if (
          safeSelectedCategory ===
            item.selectedCategory &&
          safeSuggestedCategory ===
            item.suggestedCategory
        ) {
          return item;
        }

        return {
          ...item,
          selectedCategory:
            safeSelectedCategory,
          suggestedCategory:
            safeSuggestedCategory,
        };
      });

    const hasChanges =
      normalizedItems.some(
        (item, index) =>
          item.selectedCategory !==
            items[index].selectedCategory ||
          item.suggestedCategory !==
            items[index].suggestedCategory,
      );

    if (hasChanges) {
      onChange(normalizedItems);
    }
  }, [category, items, onChange]);

  const filteredItems =
    useMemo(() => {
      if (!category) {
        return [];
      }

      return items.filter((item) => {
        if (
          item.selectedCategory === category
        ) {
          return true;
        }

        return (
          category === 'Sem categoria' &&
          isInvalidCategory(
            item.selectedCategory,
          )
        );
      });
    }, [items, category]);

  const normalizedCategories =
    useMemo(() => {
      const values =
        categories
          .map((categoryOption) =>
            getSafeCategory({
              value:
                categoryOption,
              fallback:
                'Sem categoria',
            }),
          )
          .filter(Boolean);

      const allCategories =
        Array.from(
          new Set([
            ...values,
            modalCategory,
            'Sem categoria',
          ]),
        );

      return allCategories.sort((a, b) =>
        a.localeCompare(
          b,
          'pt-BR',
        ),
      );
    }, [categories, modalCategory]);

  const activeItems =
    useMemo(
      () =>
        filteredItems.filter(
          (item) => !item.ignored,
        ),
      [filteredItems],
    );

  const ignoredItems =
    useMemo(
      () =>
        filteredItems.filter(
          (item) => item.ignored,
        ),
      [filteredItems],
    );

  const needsReviewItems =
    useMemo(
      () =>
        filteredItems.filter((item) => {
          const selectedCategory =
            getSafeCategory({
              value:
                item.selectedCategory,
              fallback:
                modalCategory,
            });

          const suggestedCategory =
            getSafeCategory({
              value:
                item.suggestedCategory,
              fallback:
                selectedCategory,
            });

          return (
            !item.ignored &&
            (item.confidence === 'low' ||
              selectedCategory !==
                suggestedCategory)
          );
        }),
      [filteredItems, modalCategory],
    );

  const reviewedItems =
    activeItems.length -
    needsReviewItems.length;

  const reviewProgress =
    activeItems.length > 0
      ? Math.round(
          (reviewedItems /
            activeItems.length) *
            100,
        )
      : 0;

  const total =
    useMemo(
      () =>
        activeItems.reduce(
          (acc, item) =>
            acc + item.amount,
          0,
        ),
      [activeItems],
    );

  const average =
    activeItems.length > 0
      ? total / activeItems.length
      : 0;

  const biggest =
    useMemo(
      () =>
        activeItems.reduce(
          (max, item) =>
            item.amount > max
              ? item.amount
              : max,
          0,
        ),
      [activeItems],
    );

  const averageConfidence =
    filteredItems.length > 0
      ? Math.round(
          filteredItems.reduce(
            (acc, item) =>
              acc +
              getConfidenceScore(
                item.confidence,
              ),
            0,
          ) / filteredItems.length,
        )
      : 0;

  const visibleItems =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(search);

      const reviewIds =
        new Set(
          needsReviewItems.map(
            (item) => item.externalId,
          ),
        );

      return filteredItems.filter((item) => {
        const selectedCategory =
          getSafeCategory({
            value:
              item.selectedCategory,
            fallback:
              modalCategory,
          });

        const suggestedCategory =
          getSafeCategory({
            value:
              item.suggestedCategory,
            fallback:
              selectedCategory,
          });

        const matchesSearch =
          normalizedSearch.length === 0 ||
          normalizeText(
            item.description,
          ).includes(normalizedSearch) ||
          normalizeText(
            selectedCategory,
          ).includes(normalizedSearch) ||
          normalizeText(
            suggestedCategory,
          ).includes(normalizedSearch);

        const matchesReviewFilter =
          onlyNeedsReview
            ? reviewIds.has(
                item.externalId,
              )
            : true;

        return (
          matchesSearch &&
          matchesReviewFilter
        );
      });
    }, [
      filteredItems,
      search,
      onlyNeedsReview,
      needsReviewItems,
      modalCategory,
    ]);

  if (!category) return null;

  function updateItem(
    externalId: string,
    partial: Partial<ImportReviewItem>,
  ) {
    onChange(
      items.map((item) =>
        item.externalId === externalId
          ? {
              ...item,
              ...partial,
            }
          : item,
      ),
    );
  }

  function applyCategoryToAll() {
    onChange(
      items.map((item) => {
        const belongsToOpenCategory =
          filteredItems.some(
            (filteredItem) =>
              filteredItem.externalId ===
              item.externalId,
          );

        if (!belongsToOpenCategory) {
          return item;
        }

        return {
          ...item,
          selectedCategory:
            modalCategory,
          suggestedCategory:
            modalCategory,
          ignored: false,
        };
      }),
    );
  }

  return (
    <div
      className="modal-backdrop imports-review-backdrop"
      onClick={onClose}
    >
      <div
        className="imports-review-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header className="imports-review-modal-header">
          <div className="imports-review-title-area">
            <div className="imports-review-category-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <span className="goal-eyebrow">
                Revisão por categoria
              </span>

              <h2>{modalCategory}</h2>

              <p>
                {filteredItems.length}{' '}
                {filteredItems.length === 1
                  ? 'transação'
                  : 'transações'}{' '}
                · {formatCurrency(total)} movimentados ·{' '}
                {averageConfidence}% de confiança média
              </p>
            </div>
          </div>

          <button
            type="button"
            className="imports-review-close-btn"
            onClick={onClose}
            aria-label="Fechar revisão"
          >
            <X size={20} />
          </button>
        </header>

        <section className="imports-review-metrics">
          <ReviewMetric
            label="Ativas"
            value={String(activeItems.length)}
            description="Entrarão na importação"
            tone="success"
          />

          <ReviewMetric
            label="Revisar"
            value={String(needsReviewItems.length)}
            description="Baixa confiança ou ajuste manual"
            tone={
              needsReviewItems.length > 0
                ? 'warning'
                : 'success'
            }
          />

          <ReviewMetric
            label="Ignoradas"
            value={String(ignoredItems.length)}
            description="Fora da importação"
            tone={
              ignoredItems.length > 0
                ? 'warning'
                : 'neutral'
            }
          />

          <ReviewMetric
            label="Maior valor"
            value={formatCurrency(biggest)}
            description={`Média: ${formatCurrency(average)}`}
            tone="neutral"
          />
        </section>

        <section className="imports-review-toolbar">
          <div className="imports-review-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar lançamento, categoria ou sugestão..."
            />
          </div>

          <div className="imports-review-toolbar-actions">
            <button
              type="button"
              className="imports-review-apply-all-btn"
              onClick={applyCategoryToAll}
            >
              <Wand2 size={16} />
              Aplicar a todos
            </button>

            <button
              type="button"
              className={`imports-review-filter-btn ${
                onlyNeedsReview
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setOnlyNeedsReview(
                  (current) => !current,
                )
              }
            >
              <SlidersHorizontal size={16} />

              {onlyNeedsReview
                ? 'Mostrando revisão'
                : 'Somente revisão'}
            </button>
          </div>
        </section>

        <section className="imports-review-list">
          {visibleItems.length === 0 ? (
            <div className="imports-review-empty">
              <CheckCircle2 size={34} />

              <strong>
                Nenhum lançamento para revisar
              </strong>

              <span>
                Ajuste a busca ou desative o filtro de revisão.
              </span>
            </div>
          ) : (
            visibleItems.map((item) => {
              const currentCategory =
                getSafeCategory({
                  value:
                    item.selectedCategory,
                  fallback:
                    modalCategory,
                });

              const suggestedCategory =
                getSafeCategory({
                  value:
                    item.suggestedCategory,
                  fallback:
                    currentCategory,
                });

              const requiresReview =
                !item.ignored &&
                (item.confidence === 'low' ||
                  currentCategory !==
                    suggestedCategory);

              return (
                <article
                  key={item.externalId}
                  className={`imports-review-row ${
                    item.ignored
                      ? 'ignored'
                      : ''
                  } ${
                    requiresReview
                      ? 'needs-review'
                      : ''
                  }`}
                >
                  <div className="imports-review-row-main">
                    <div>
                      <strong>
                        {item.description}
                      </strong>

                      <div className="imports-review-row-meta">
                        <span>
                          {formatDate(item.date)}
                        </span>

                        <span>·</span>

                        <span
                          className={`imports-review-confidence ${item.confidence}`}
                        >
                          {
                            confidenceLabels[
                              item.confidence
                            ]
                          }
                        </span>

                        {item.matchedKeyword && (
                          <>
                            <span>·</span>

                            <span>
                              Palavra:{' '}
                              {item.matchedKeyword}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <strong
                      className={
                        item.type === 'income'
                          ? 'income'
                          : 'expense'
                      }
                    >
                      {item.type === 'income'
                        ? '+'
                        : '-'}
                      {formatCurrency(item.amount)}
                    </strong>
                  </div>

                  <div className="imports-review-row-actions">
                    <div className="imports-review-ai-suggestion">
                      <span>
                        Sugestão automática
                      </span>

                      <strong>
                        {suggestedCategory}
                      </strong>
                    </div>

                    <label>
                      <span>
                        Categoria final
                      </span>

                      <select
                        className="filter-select imports-review-select"
                        value={currentCategory}
                        disabled={item.ignored}
                        onChange={(event) =>
                          updateItem(
                            item.externalId,
                            {
                              selectedCategory:
                                event.target.value,
                              suggestedCategory:
                                suggestedCategory,
                            },
                          )
                        }
                      >
                        {normalizedCategories.map(
                          (categoryOption) => (
                            <option
                              key={
                                categoryOption
                              }
                              value={
                                categoryOption
                              }
                            >
                              {categoryOption}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <button
                      type="button"
                      className={`imports-review-ignore-btn ${
                        item.ignored
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        updateItem(
                          item.externalId,
                          {
                            ignored:
                              !item.ignored,
                          },
                        )
                      }
                    >
                      <Ban size={15} />

                      {item.ignored
                        ? 'Ignorada'
                        : 'Ignorar'}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <footer className="imports-review-footer">
          <div className="imports-review-footer-progress">
            <div>
              <strong>
                Progresso da revisão
              </strong>

              <span>
                {reviewedItems} revisada(s) ·{' '}
                {needsReviewItems.length} pendente(s) ·{' '}
                {ignoredItems.length} ignorada(s)
              </span>
            </div>

            <div className="imports-review-progress-track">
              <div
                style={{
                  width: `${reviewProgress}%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={onClose}
          >
            Aplicar alterações
          </button>
        </footer>
      </div>
    </div>
  );
}

type ReviewMetricProps = {
  label: string;
  value: string;
  description: string;
  tone:
    | 'success'
    | 'warning'
    | 'neutral';
};

function ReviewMetric({
  label,
  value,
  description,
  tone,
}: ReviewMetricProps) {
  return (
    <div className={`imports-review-metric ${tone}`}>
      <span>{label}</span>

      <strong>{value}</strong>

      <p>{description}</p>
    </div>
  );
}
