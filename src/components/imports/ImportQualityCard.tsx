import type {
    ImportReviewItem,
  } from '../../types/importReview';
  
  type Props = {
    items: ImportReviewItem[];
  };
  
  function calculateQuality(items: ImportReviewItem[]) {
    if (items.length === 0) {
      return 0;
    }
  
    const score = items.reduce(
      (acc, item) => {
        if (item.ignored) {
          return acc + 0.5;
        }
  
        if (item.confidence === 'high') {
          return acc + 1;
        }
  
        if (item.confidence === 'medium') {
          return acc + 0.75;
        }
  
        return acc + 0.35;
      },
      0,
    );
  
    return Math.round(
      (score / items.length) * 100,
    );
  }
  
  export default function ImportQualityCard({
    items,
  }: Props) {
    const quality =
      calculateQuality(items);
  
    const lowConfidence =
      items.filter(
        (item) =>
          item.confidence === 'low' &&
          !item.ignored,
      ).length;
  
    const ignored =
      items.filter(
        (item) => item.ignored,
      ).length;
  
    const status =
      quality >= 85
        ? 'Importação confiável'
        : quality >= 65
          ? 'Revisão recomendada'
          : 'Revisão necessária';
  
    return (
      <div className="planning-diagnosis-card healthy">
        <div className="planning-diagnosis-header">
          <div>
            <span className="goal-eyebrow">
              Qualidade da importação
            </span>
  
            <div className="goal-values">
              <strong>
                {quality}%
              </strong>
  
              <span>
                {status}
              </span>
            </div>
          </div>
  
          <div className="planning-metric-icon">
            {quality}%
          </div>
        </div>
  
        <p className="planning-alert-item">
          {lowConfidence} transação(ões) com baixa confiança
          {ignored > 0
            ? ` · ${ignored} ignorada(s)`
            : ''}
        </p>
      </div>
    );
  }