import type {
    ImportReviewItem,
  } from '../../types/importReview';
  
  type Props = {
    items: ImportReviewItem[];
  
    categories: string[];
  
    onChange: (items: ImportReviewItem[]) => void;
  };
  
  const confidenceLabels = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  };
  
  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
  
  export default function ImportReviewTable({
    items,
    categories,
    onChange,
  }: Props) {
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
  
    if (items.length === 0) {
      return null;
    }
  
    return (
      <div className="transactions-list">
        {items.map((item) => (
          <div
            key={item.externalId}
            className="transaction-item"
            style={{
              opacity: item.ignored ? 0.45 : 1,
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>
                {item.description}
              </strong>
  
              <span>
                {new Date(
                  `${item.date}T12:00:00`,
                ).toLocaleDateString('pt-BR')}{' '}
                · Sugestão:{' '}
                <strong>
                  {item.suggestedCategory}
                </strong>
                {item.matchedKeyword
                  ? ` · Palavra: ${item.matchedKeyword}`
                  : ''}
              </span>
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
  
            <select
              className="filter-select"
              value={item.selectedCategory}
              disabled={item.ignored}
              onChange={(event) =>
                updateItem(item.externalId, {
                  selectedCategory:
                    event.target.value,
                })
              }
              style={{
                minWidth: 180,
              }}
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
  
            <span className="category-badge">
              {confidenceLabels[item.confidence]}
            </span>
  
            <label
              className="planning-input-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={item.ignored ?? false}
                onChange={(event) =>
                  updateItem(item.externalId, {
                    ignored:
                      event.target.checked,
                  })
                }
              />
              Ignorar
            </label>
          </div>
        ))}
      </div>
    );
  }