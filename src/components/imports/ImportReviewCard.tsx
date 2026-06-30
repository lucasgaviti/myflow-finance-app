import type {
    ImportReviewItem,
  } from '../../types/importReview';
  
  type Props = {
    item: ImportReviewItem;
  
    categories: string[];
  
    onChange: (
      externalId: string,
      partial: Partial<ImportReviewItem>,
    ) => void;
  };
  
  const confidenceConfig = {
    high: {
      label: 'Alta confiança',
      icon: '●',
    },
    medium: {
      label: 'Média confiança',
      icon: '●',
    },
    low: {
      label: 'Baixa confiança',
      icon: '●',
    },
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
  
  function getDefaultKeyword(
    description: string,
  ) {
    return description
      .replace(/pix enviado:/i, '')
      .replace(/pix recebido:/i, '')
      .replace(/compra no débito/i, '')
      .replace(/compra no debito/i, '')
      .replace(/"/g, '')
      .trim()
      .slice(0, 60);
  }
  
  export default function ImportReviewCard({
    item,
    categories,
    onChange,
  }: Props) {
    const confidence =
      confidenceConfig[item.confidence];
  
    const categoryWasChanged =
      item.selectedCategory !==
      item.suggestedCategory;
  
    const canCreateRule =
      categoryWasChanged &&
      !item.ignored;
  
    const ruleKeyword =
      item.ruleKeyword ??
      getDefaultKeyword(
        item.description,
      );
  
    return (
      <article
        style={{
          opacity: item.ignored ? 0.5 : 1,
          border:
            item.confidence === 'low' && !item.ignored
              ? '1px solid rgba(245, 158, 11, 0.5)'
              : '1px solid rgba(148, 163, 184, 0.18)',
          borderRadius: 22,
          background:
            item.confidence === 'low' && !item.ignored
              ? 'linear-gradient(135deg, rgba(255,251,235,0.9), rgba(255,255,255,0.98))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.88))',
          boxShadow:
            '0 18px 44px rgba(15, 23, 42, 0.06)',
          padding: 18,
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: 15,
                lineHeight: 1.35,
                color: '#0f172a',
                marginBottom: 8,
              }}
            >
              {item.description}
            </strong>
  
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span className="category-badge">
                {formatDate(item.date)}
              </span>
  
              <span className="category-badge">
                {confidence.icon} {confidence.label}
              </span>
  
              {item.matchedKeyword && (
                <span className="category-badge">
                  Palavra: {item.matchedKeyword}
                </span>
              )}
            </div>
          </div>
  
          <strong
            className={
              item.type === 'income'
                ? 'income'
                : 'expense'
            }
            style={{
              fontSize: 18,
              whiteSpace: 'nowrap',
            }}
          >
            {item.type === 'income'
              ? '+'
              : '-'}
            {formatCurrency(item.amount)}
          </strong>
        </div>
  
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(180px, 1fr) auto',
            gap: 14,
            alignItems: 'end',
          }}
        >
          <label className="planning-input-field">
            <span className="planning-input-label">
              Categoria final
            </span>
  
            <select
              className="filter-select"
              value={item.selectedCategory}
              disabled={item.ignored}
              onChange={(event) =>
                onChange(item.externalId, {
                  selectedCategory:
                    event.target.value,
  
                  shouldCreateRule:
                    event.target.value !==
                    item.suggestedCategory,
  
                  ruleKeyword:
                    item.ruleKeyword ??
                    getDefaultKeyword(
                      item.description,
                    ),
                })
              }
            >
              {categories.map((categoryOption) => (
                <option
                  key={categoryOption}
                  value={categoryOption}
                >
                  {categoryOption}
                </option>
              ))}
            </select>
          </label>
  
          <label
            className="planning-input-label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 14px',
              border:
                '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: 14,
              background: '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <input
              type="checkbox"
              checked={item.ignored ?? false}
              onChange={(event) =>
                onChange(item.externalId, {
                  ignored: event.target.checked,
  
                  shouldCreateRule:
                    event.target.checked
                      ? false
                      : item.shouldCreateRule,
                })
              }
            />
            Ignorar
          </label>
        </div>
  
        {categoryWasChanged && (
          <div
            style={{
              border:
                '1px solid rgba(59, 130, 246, 0.16)',
              borderRadius: 18,
              background:
                'rgba(239, 246, 255, 0.72)',
              padding: 14,
              display: 'grid',
              gap: 12,
            }}
          >
            <p
              className="planning-metric-description"
              style={{
                margin: 0,
              }}
            >
              Sugestão original:{' '}
              <strong>
                {item.suggestedCategory}
              </strong>
            </p>
  
            <label
              className="planning-input-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: canCreateRule
                  ? 'pointer'
                  : 'not-allowed',
              }}
            >
              <input
                type="checkbox"
                checked={
                  item.shouldCreateRule ?? false
                }
                disabled={!canCreateRule}
                onChange={(event) =>
                  onChange(item.externalId, {
                    shouldCreateRule:
                      event.target.checked,
  
                    ruleKeyword:
                      ruleKeyword,
                  })
                }
              />
              Criar regra automática para próximas importações
            </label>
  
            {(item.shouldCreateRule ??
              false) && (
              <label className="planning-input-field">
                <span className="planning-input-label">
                  Palavra-chave da regra
                </span>
  
                <input
                  className="search-input"
                  value={ruleKeyword}
                  disabled={!canCreateRule}
                  onChange={(event) =>
                    onChange(item.externalId, {
                      ruleKeyword:
                        event.target.value,
                    })
                  }
                  placeholder="Ex.: sem parar, drogal, ifood"
                />
              </label>
            )}
          </div>
        )}
      </article>
    );
  }