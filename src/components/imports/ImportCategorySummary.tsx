import type {
  ImportReviewItem,
} from '../../types/importReview';

type CategoryGroup = {
  category: string;

  items: ImportReviewItem[];

  total: number;

  count: number;

  highConfidence: number;

  mediumConfidence: number;

  lowConfidence: number;

  ignored: number;
};

type Props = {
  items: ImportReviewItem[];

  onSelectCategory: (category: string) => void;
};

const categoryIcons: Record<string, string> = {
  Receitas: '💰',
  Investimentos: '📈',
  Mercado: '🛒',
  Alimentação: '🍽️',
  Transporte: '🚗',
  Moradia: '🏠',
  Compras: '🛍️',
  Saúde: '💊',
  Pets: '🐾',
  Cartão: '💳',
  Assinaturas: '🔁',
  Lazer: '🎬',
  'Sem categoria': '⚠️',
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getCategoryIcon(category: string) {
  return categoryIcons[category] ?? '📂';
}

function groupByCategory(
  items: ImportReviewItem[],
): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  items.forEach((item) => {
    const category =
      item.selectedCategory || 'Sem categoria';

    const current =
      map.get(category) ?? {
        category,
        items: [],
        total: 0,
        count: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        ignored: 0,
      };

    current.items.push(item);
    current.count += 1;

    if (!item.ignored) {
      current.total += item.amount;
    }

    if (item.ignored) current.ignored += 1;
    if (item.confidence === 'high') current.highConfidence += 1;
    if (item.confidence === 'medium') current.mediumConfidence += 1;
    if (item.confidence === 'low') current.lowConfidence += 1;

    map.set(category, current);
  });

  return Array.from(map.values()).sort(
    (a, b) => {
      if (a.category === 'Sem categoria') return -1;
      if (b.category === 'Sem categoria') return 1;
      return b.total - a.total;
    },
  );
}

export default function ImportCategorySummary({
  items,
  onSelectCategory,
}: Props) {
  const groups = groupByCategory(items);

  if (groups.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}
    >
      {groups.map((group) => {
        const needsReview =
          group.category === 'Sem categoria' ||
          group.lowConfidence > 0;

        const reviewedCount =
          group.highConfidence +
          group.mediumConfidence;

        return (
          <button
            key={group.category}
            type="button"
            onClick={() =>
              onSelectCategory(group.category)
            }
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              border: needsReview
                ? '1px solid rgba(245, 158, 11, 0.65)'
                : '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: 24,
              padding: 20,
              background: needsReview
                ? 'linear-gradient(135deg, rgba(255,251,235,0.96), rgba(255,255,255,0.98))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.9))',
              boxShadow:
                '0 18px 44px rgba(15, 23, 42, 0.06)',
              minHeight: 178,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition:
                'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 16,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 20,
                    background: needsReview
                      ? 'rgba(245, 158, 11, 0.14)'
                      : 'rgba(59, 130, 246, 0.1)',
                  }}
                >
                  {getCategoryIcon(group.category)}
                </div>

                <span
                  className="category-badge"
                  style={{
                    background: needsReview
                      ? 'rgba(245, 158, 11, 0.14)'
                      : undefined,
                  }}
                >
                  {group.count} itens
                </span>
              </div>

              <span
                className="planning-metric-label"
                style={{
                  display: 'block',
                  marginTop: 16,
                }}
              >
                Categoria
              </span>

              <strong
                style={{
                  display: 'block',
                  marginTop: 4,
                  fontSize: 20,
                  lineHeight: 1.15,
                  color: '#0f172a',
                  letterSpacing: '-0.04em',
                }}
              >
                {group.category}
              </strong>

              <strong
                style={{
                  display: 'block',
                  marginTop: 12,
                  fontSize: 18,
                  color: '#0f172a',
                }}
              >
                {formatCurrency(group.total)}
              </strong>
            </div>

            <div
              style={{
                marginTop: 18,
              }}
            >
              <p
                className="planning-metric-description"
                style={{
                  margin: 0,
                }}
              >
                {reviewedCount} classificada(s)
                {group.lowConfidence > 0
                  ? ` · ${group.lowConfidence} baixa confiança`
                  : ''}
                {group.ignored > 0
                  ? ` · ${group.ignored} ignorada(s)`
                  : ''}
              </p>

              <div
                style={{
                  marginTop: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  color: needsReview
                    ? '#92400e'
                    : '#166534',
                  background: needsReview
                    ? 'rgba(245, 158, 11, 0.14)'
                    : 'rgba(34, 197, 94, 0.12)',
                }}
              >
                {needsReview
                  ? '⚠ Revisar categoria'
                  : '✓ Revisada'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}