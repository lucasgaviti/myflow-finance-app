import {
  useMemo,
  useState,
} from 'react';

import {
  Upload,
  Trash2,
  FileSpreadsheet,
  CloudUpload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sparkles,
  ListChecks,
  ShieldCheck,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import LoadingButton from '../components/LoadingButton';

import {
  notifySuccess,
  notifyError,
} from '../lib/toast';
import ImportCategorySummary from '../components/imports/ImportCategorySummary';
import ImportCategoryModal from '../components/imports/ImportCategoryModal';

import { useTransactionImports } from '../hook/useTransactionImports';
import { useTransactions } from '../hook/useTransactions';
import { useCategoryRules } from '../hook/useCategoryRules';

import type {
  NormalizedImportedTransaction,
} from '../utils/imports/transactionNormalizer';

import {
  detectImportFileType,
  getImportFileLabel,
  type ImportFileType,
} from '../utils/imports/importDetector';

import {
  getCsvHeaders,
  parseCsvTransactions,
} from '../utils/imports/csvParser';

import {
  parsePdfTransactions,
} from '../utils/imports/pdfParser';

import {
  parseOfxTransactions,
} from '../utils/imports/ofxParser';

import {
  mapReviewItemsToImportedTransactions,
  mapTransactionsToReviewItems,
} from '../utils/imports/importReviewMapper';

import {
  suggestCategoryFromUserRules,
} from '../utils/imports/userCategoryRuleMatcher';

import {
  mergeCategories,
} from '../utils/categories/defaultCategories';

import type {
  ImportReviewItem,
} from '../types/importReview';

import type {
  CategoryRule,
} from '../types/categoryRule';

type ImportPreview = {
  transactions: NormalizedImportedTransaction[];

  incomeCount: number;

  expenseCount: number;

  incomeTotal: number;

  expenseTotal: number;

  balance: number;
};

type CsvColumnSuggestion = {
  date?: string;

  description?: string;

  amount?: string;
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findHeaderByKeywords(
  headers: string[],
  keywords: string[],
) {
  return headers.find((header) => {
    const normalizedHeader =
      normalizeHeader(header);

    return keywords.some((keyword) =>
      normalizedHeader.includes(
        normalizeHeader(keyword),
      ),
    );
  });
}

function suggestCsvColumns(
  headers: string[],
): CsvColumnSuggestion {
  return {
    date:
      findHeaderByKeywords(headers, [
        'date',
        'data',
        'dt',
        'posted',
        'lancamento',
        'lançamento',
      ]),

    description:
      findHeaderByKeywords(headers, [
        'description',
        'descricao',
        'descrição',
        'historico',
        'histórico',
        'memo',
        'merchant',
        'titulo',
        'title',
        'name',
      ]),

    amount:
      findHeaderByKeywords(headers, [
        'amount',
        'valor',
        'value',
        'quantia',
        'preco',
        'preço',
        'total',
      ]),
  };
}

function buildPreview(
  transactions: NormalizedImportedTransaction[],
): ImportPreview {
  const incomeTransactions =
    transactions.filter(
      (transaction) =>
        transaction.type === 'income',
    );

  const expenseTransactions =
    transactions.filter(
      (transaction) =>
        transaction.type === 'expense',
    );

  const incomeTotal =
    incomeTransactions.reduce(
      (acc, transaction) =>
        acc + transaction.amount,
      0,
    );

  const expenseTotal =
    expenseTransactions.reduce(
      (acc, transaction) =>
        acc + transaction.amount,
      0,
    );

  return {
    transactions,

    incomeCount:
      incomeTransactions.length,

    expenseCount:
      expenseTransactions.length,

    incomeTotal,

    expenseTotal,

    balance:
      incomeTotal - expenseTotal,
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function applyUserCategoryRules({
  transactions,
  rules,
}: {
  transactions: NormalizedImportedTransaction[];
  rules: CategoryRule[];
}) {
  if (rules.length === 0) {
    return transactions;
  }

  return transactions.map((transaction) => {
    const suggestion =
      suggestCategoryFromUserRules({
        description:
          transaction.description,

        rules,
      });

    if (!suggestion) {
      return transaction;
    }

    return {
      ...transaction,

      category:
        suggestion.category,

      categoryConfidence:
        suggestion.confidence,

      categoryMatchedKeyword:
        suggestion.matchedKeyword,
    };
  });
}

export default function Imports() {
  const {
    imports,
    loading,
    createImport,
    updateImport,
    removeImport,
  } = useTransactionImports();

  const {
    transactions,
    importTransactions,
  } = useTransactions();

  const {
    rules: categoryRules,
    createRule,
  } = useCategoryRules();

  const categoryOptions =
    mergeCategories(
      transactions.map(
        (transaction) =>
          transaction.category,
      ),
    );

  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState('');

  const [
    detectedType,
    setDetectedType,
  ] = useState<ImportFileType>('unknown');

  const [
    csvContent,
    setCsvContent,
  ] = useState('');

  const [
    csvHeaders,
    setCsvHeaders,
  ] = useState<string[]>([]);

  const [
    dateColumn,
    setDateColumn,
  ] = useState('');

  const [
    descriptionColumn,
    setDescriptionColumn,
  ] = useState('');

  const [
    amountColumn,
    setAmountColumn,
  ] = useState('');

  const [
    preview,
    setPreview,
  ] = useState<ImportPreview | null>(null);

  const [
    reviewItems,
    setReviewItems,
  ] = useState<ImportReviewItem[]>([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string | null>(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    readingFile,
    setReadingFile,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  function resetImportState() {
    setSelectedFileName('');
    setDetectedType('unknown');
    setCsvContent('');
    setCsvHeaders([]);
    setDateColumn('');
    setDescriptionColumn('');
    setAmountColumn('');
    setPreview(null);
    setReviewItems([]);
    setSelectedCategory(null);
  }

  function processImportedTransactions(
    transactions: NormalizedImportedTransaction[],
  ) {
    const transactionsWithRules =
      applyUserCategoryRules({
        transactions,

        rules:
          categoryRules,
      });

    setReviewItems(
      mapTransactionsToReviewItems(
        transactionsWithRules,
      ),
    );

    setPreview(
      buildPreview(
        transactionsWithRules,
      ),
    );
  }

  async function saveCategoryRulesFromReview() {
    const rulesToCreate =
      reviewItems.filter(
        (item) =>
          item.shouldCreateRule &&
          !item.ignored &&
          item.ruleKeyword?.trim() &&
          item.selectedCategory,
      );

    if (rulesToCreate.length === 0) {
      return {
        created: 0,
        failed: 0,
      };
    }

    const uniqueRules =
      Array.from(
        new Map(
          rulesToCreate.map((item) => [
            item.ruleKeyword
              ?.trim()
              .toLowerCase() ?? '',
            {
              keyword:
                item.ruleKeyword?.trim() ?? '',

              category:
                item.selectedCategory,
            },
          ]),
        ).values(),
      ).filter(
        (rule) =>
          rule.keyword.length > 0 &&
          rule.category.length > 0,
      );

    let created = 0;
    let failed = 0;

    for (const rule of uniqueRules) {
      try {
        const result =
          await createRule(rule);

        if (result) {
          created += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        console.error(
          'Erro ao salvar regra de categoria:',
          error,
        );

        failed += 1;
      }
    }

    return {
      created,
      failed,
    };
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    resetImportState();

    const fileType =
      detectImportFileType(file);

    setSelectedFileName(file.name);
    setDetectedType(fileType);
    setReadingFile(true);

    try {
      if (fileType === 'unknown') {
        alert(
          'Formato não reconhecido. Envie um arquivo CSV, PDF extraível ou OFX.',
        );

        return;
      }

      if (fileType === 'csv') {
        const content =
          await file.text();

        const headers =
          getCsvHeaders(content);

        const suggested =
          suggestCsvColumns(headers);

        setCsvContent(content);
        setCsvHeaders(headers);

        setDateColumn(
          suggested.date ?? '',
        );

        setDescriptionColumn(
          suggested.description ?? '',
        );

        setAmountColumn(
          suggested.amount ?? '',
        );

        return;
      }

      if (fileType === 'pdf') {
        const transactions =
          await parsePdfTransactions(file);

        processImportedTransactions(
          transactions,
        );

        return;
      }

      if (fileType === 'ofx') {
        const transactions =
          await parseOfxTransactions(file);

        processImportedTransactions(
          transactions,
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao processar o arquivo. Verifique se o PDF possui texto extraível ou tente outro formato.',
      );
    } finally {
      setReadingFile(false);
    }
  }

  function handleBuildCsvPreview() {
    if (
      !csvContent ||
      !dateColumn ||
      !descriptionColumn ||
      !amountColumn
    ) {
      alert(
        'Selecione as colunas de data, descrição e valor.',
      );

      return;
    }

    try {
      const transactions =
        parseCsvTransactions({
          csvContent,

          columnMap: {
            date: dateColumn,
            description:
              descriptionColumn,
            amount: amountColumn,
          },
        });

      processImportedTransactions(
        transactions,
      );
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao gerar pré-visualização. Verifique se as colunas selecionadas estão corretas.',
      );
    }
  }

  async function handleSaveImport() {
    if (
      !selectedFileName ||
      reviewItems.length === 0 ||
      detectedType === 'unknown'
    ) {
      alert(
        'Gere uma pré-visualização válida antes de importar.',
      );

      return;
    }

    const finalTransactions =
      mapReviewItemsToImportedTransactions(
        reviewItems,
      );

    if (finalTransactions.length === 0) {
      alert(
        'Todas as transações foram marcadas para ignorar.',
      );

      return;
    }

    setSaving(true);

    try {
      const source =
        detectedType === 'pdf'
          ? 'pdf'
          : detectedType === 'ofx'
            ? 'ofx'
            : 'csv';

      const importBatch =
        await createImport({
          file_name: selectedFileName,

          source,

          total_transactions:
            finalTransactions.length,

          imported_transactions: 0,

          status: 'processing',
        });

      const result =
        await importTransactions({
          parsedTransactions:
            finalTransactions,

          importBatchId:
            importBatch.id,

          source,
        });

      if (!result) {
        try {
          await updateImport(
            importBatch.id,
            {
              imported_transactions: 0,

              status: 'failed',
            },
          );
        } catch (updateError) {
          console.error(
            'Erro ao marcar lote como falho:',
            updateError,
          );
        }

        throw new Error(
          'Falha ao importar transações.',
        );
      }

      let importStatusUpdated = true;

      try {
        await updateImport(
          importBatch.id,
          {
            imported_transactions:
              result.imported,

            status: 'completed',
          },
        );
      } catch (updateError) {
        console.error(
          'Erro ao atualizar lote de importação:',
          updateError,
        );

        importStatusUpdated = false;
      }

      const rulesResult =
        await saveCategoryRulesFromReview();

      resetImportState();

      if (!importStatusUpdated) {
        notifyError(
          'O histórico da importação não foi atualizado.',
        );
      }

      if (rulesResult.created > 0) {
        notifySuccess(
          `${rulesResult.created} regra(s) automática(s) criada(s).`,
        );
      }

      if (rulesResult.failed > 0) {
        notifyError(
          `${rulesResult.failed} regra(s) não puderam ser salvas.`,
        );
      }
    } catch (error) {
      console.error(error);

      notifyError(
        'Não foi possível finalizar o processamento da importação.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteImport(id: string) {
    const confirmed =
      window.confirm(
        'Deseja excluir este lote? As transações importadas por ele também serão removidas.',
      );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await removeImport(id);
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao excluir importação.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  const categorizedCount =
    reviewItems.filter(
      (item) =>
        !item.ignored &&
        item.selectedCategory &&
        item.selectedCategory !==
          'Sem categoria',
    ).length;

  const ignoredCount =
    reviewItems.filter(
      (item) => item.ignored,
    ).length;

  const classificationRate =
    reviewItems.length > 0
      ? Math.round(
          (categorizedCount /
            reviewItems.length) *
            100,
        )
      : 0;

  const highConfidenceCount =
    reviewItems.filter(
      (item) =>
        item.confidence === 'high',
    ).length;

  const previewRows =
    useMemo(
      () =>
        reviewItems
          .filter((item) => !item.ignored)
          .slice(0, 8),
      [reviewItems],
    );

  const topCategory =
    useMemo(() => {
      if (reviewItems.length === 0) {
        return null;
      }

      const categoryTotals =
        new Map<
          string,
          {
            count: number;
            amount: number;
          }
        >();

      reviewItems.forEach((item) => {
        if (
          item.ignored ||
          !item.selectedCategory
        ) {
          return;
        }

        const current =
          categoryTotals.get(
            item.selectedCategory,
          ) ?? {
            count: 0,
            amount: 0,
          };

        current.count += 1;
        current.amount +=
          Math.abs(item.amount);

        categoryTotals.set(
          item.selectedCategory,
          current,
        );
      });

      const [category, data] =
        Array.from(
          categoryTotals.entries(),
        ).sort(
          (a, b) =>
            b[1].amount -
            a[1].amount,
        )[0] ?? [];

      if (!category || !data) {
        return null;
      }

      return {
        category,
        ...data,
      };
    }, [reviewItems]);

  return (
    <div className="imports-page">
      <div className="dashboard-header imports-header">
        <div>
          <h1 className="dashboard-title">
            Importações
          </h1>

          <p className="dashboard-subtitle">
            Envie extratos CSV, OFX ou PDF extraível. O MyFlow lê, classifica e prepara os lançamentos para revisão antes de salvar.
          </p>
        </div>

        {preview && (
          <div className="imports-header-badge">
            <Sparkles size={16} />
            Prévia pronta para revisão
          </div>
        )}
      </div>

      <Card
        title="Nova importação"
        subtitle="Arraste ou selecione seu extrato financeiro para começar."
      >
        <div className="imports-upload-grid">
          <label className="imports-dropzone">
            <input
              type="file"
              accept=".csv,text/csv,.pdf,application/pdf,.ofx,.qfx"
              onChange={handleFileChange}
            />

            <div className="imports-dropzone-icon">
              {readingFile ? (
                <FileText size={28} />
              ) : (
                <CloudUpload size={30} />
              )}
            </div>

            <div>
              <strong>
                {selectedFileName
                  ? selectedFileName
                  : 'Arraste seu extrato aqui'}
              </strong>

              <span>
                {readingFile
                  ? 'Processando arquivo...'
                  : 'ou clique para selecionar CSV, OFX ou PDF extraível'}
              </span>
            </div>

            <div className="imports-file-types">
              <span>CSV</span>
              <span>OFX</span>
              <span>PDF</span>
            </div>
          </label>

          <div className="imports-upload-side">
            <div className="imports-process-step active">
              <span>1</span>
              <div>
                <strong>
                  Ler arquivo
                </strong>
                <p>
                  O MyFlow identifica formato, colunas e transações.
                </p>
              </div>
            </div>

            <div
              className={`imports-process-step ${
                preview ? 'active' : ''
              }`}
            >
              <span>2</span>
              <div>
                <strong>
                  Revisar prévia
                </strong>
                <p>
                  Confirme categorias e ignore o que não deve entrar.
                </p>
              </div>
            </div>

            <div
              className={`imports-process-step ${
                reviewItems.length > 0
                  ? 'active'
                  : ''
              }`}
            >
              <span>3</span>
              <div>
                <strong>
                  Importar
                </strong>
                <p>
                  Salve apenas lançamentos revisados e sem duplicidade.
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedFileName && (
          <div className="imports-selected-file">
            <div>
              <span className="goal-eyebrow">
                Arquivo selecionado
              </span>

              <strong>
                {selectedFileName}
              </strong>

              <p>
                Tipo detectado:{' '}
                {getImportFileLabel(
                  detectedType,
                )}
                {detectedType === 'csv' &&
                  ` · ${csvHeaders.length} colunas encontradas`}
                {detectedType === 'pdf' &&
                  ' · PDF extraível'}
                {detectedType === 'ofx' &&
                  ' · Arquivo bancário'}
              </p>
            </div>

            <div className="planning-metric-icon">
              <FileSpreadsheet size={20} />
            </div>
          </div>
        )}

        {detectedType === 'csv' &&
          csvHeaders.length > 0 && (
            <div className="imports-mapping-card">
              <div className="imports-section-title">
                <div>
                  <span className="goal-eyebrow">
                    Mapeamento das colunas
                  </span>

                  <strong>
                    Confirme os campos do CSV
                  </strong>
                </div>

                <span>
                  Ajuste apenas se a sugestão automática estiver incorreta.
                </span>
              </div>

              <div className="planning-input-grid three">
                <ColumnSelect
                  label="Coluna de data"
                  value={dateColumn}
                  headers={csvHeaders}
                  onChange={setDateColumn}
                />

                <ColumnSelect
                  label="Coluna de descrição"
                  value={descriptionColumn}
                  headers={csvHeaders}
                  onChange={
                    setDescriptionColumn
                  }
                />

                <ColumnSelect
                  label="Coluna de valor"
                  value={amountColumn}
                  headers={csvHeaders}
                  onChange={setAmountColumn}
                />
              </div>

              <div className="planning-actions">
                <button
                  type="button"
                  className="secondary-btn imports-secondary-action"
                  onClick={handleBuildCsvPreview}
                >
                  <Eye size={17} />
                  Gerar pré-visualização
                </button>
              </div>
            </div>
          )}

        <div className="imports-main-action">
          <LoadingButton
            className="primary-btn imports-import-button"
            isLoading={saving}
            onClick={handleSaveImport}
          >
            <Upload size={18} />
            {saving
              ? 'Importando...'
              : 'Importar transações'}
          </LoadingButton>
        </div>
      </Card>

      <div className="imports-summary-grid">
        <ImportSummaryCard
          label="Movimentações"
          value={
            preview
              ? String(
                  preview.transactions.length,
                )
              : '0'
          }
          description="Total identificado no arquivo."
          icon="list"
        />

        <ImportSummaryCard
          label="Receitas"
          value={
            preview
              ? formatCurrency(
                  preview.incomeTotal,
                )
              : formatCurrency(0)
          }
          description={
            preview
              ? `${preview.incomeCount} entrada(s) encontrada(s).`
              : 'Nenhuma entrada identificada.'
          }
          icon="income"
        />

        <ImportSummaryCard
          label="Despesas"
          value={
            preview
              ? formatCurrency(
                  preview.expenseTotal,
                )
              : formatCurrency(0)
          }
          description={
            preview
              ? `${preview.expenseCount} saída(s) encontrada(s).`
              : 'Nenhuma saída identificada.'
          }
          icon="expense"
        />

        <ImportSummaryCard
          label="Classificação"
          value={`${classificationRate}%`}
          description="Transações com categoria definida."
          icon="shield"
        />
      </div>

      <Card
        title="Resumo da leitura"
        subtitle="Indicadores automáticos da importação antes de salvar."
      >
        {reviewItems.length > 0 ? (
          <div className="imports-insights-grid">
            <ImportInsight
              tone="success"
              title="Arquivo processado"
              description={`${reviewItems.length} movimentação(ões) preparada(s) para revisão.`}
            />

            <ImportInsight
              tone={
                classificationRate >= 80
                  ? 'success'
                  : 'warning'
              }
              title="Qualidade de classificação"
              description={`${classificationRate}% das movimentações já possuem categoria.`}
            />

            <ImportInsight
              tone="neutral"
              title="Maior categoria"
              description={
                topCategory
                  ? `${topCategory.category}: ${formatCurrency(topCategory.amount)} em ${topCategory.count} lançamento(s).`
                  : 'Ainda não há categoria predominante.'
              }
            />

            <ImportInsight
              tone={
                ignoredCount > 0
                  ? 'warning'
                  : 'success'
              }
              title="Revisão pendente"
              description={
                ignoredCount > 0
                  ? `${ignoredCount} movimentação(ões) marcada(s) para ignorar.`
                  : `${highConfidenceCount} movimentação(ões) com alta confiança.`
              }
            />
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="Nenhuma leitura disponível"
            description="Selecione um arquivo para visualizar a qualidade, categorias e prévia das transações."
          />
        )}
      </Card>

      <div className="imports-review-grid">
        <Card
          title="Categorias identificadas"
          subtitle="Clique em uma categoria para revisar os lançamentos."
        >
          {reviewItems.length > 0 ? (
            <ImportCategorySummary
              items={reviewItems}
              onSelectCategory={
                setSelectedCategory
              }
            />
          ) : (
            <EmptyState
              icon="📂"
              title="Nenhuma categoria encontrada"
              description="As categorias aparecerão após a leitura do arquivo."
            />
          )}
        </Card>

        <Card
          title="Preview das transações"
          subtitle="Amostra dos lançamentos que serão importados."
        >
          {previewRows.length > 0 ? (
            <div className="imports-preview-list">
              {previewRows.map((item) => (
                <div
                  key={item.externalId}
                  className="imports-preview-row"
                >
                  <div>
                    <strong>
                      {item.description}
                    </strong>

                    <span>
                      {item.date} ·{' '}
                      {item.selectedCategory}
                    </span>
                  </div>

                  <span
                    className={
                      item.type === 'income'
                        ? 'income'
                        : 'expense'
                    }
                  >
                    {item.type === 'income'
                      ? '+'
                      : '-'}
                    {formatCurrency(
                      Math.abs(item.amount),
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="👁️"
              title="Nenhuma prévia disponível"
              description="Depois da leitura, as primeiras transações aparecerão aqui para conferência."
            />
          )}
        </Card>
      </div>

      <ImportCategoryModal
        category={selectedCategory}
        items={reviewItems}
        categories={categoryOptions}
        onClose={() => setSelectedCategory(null)}
        onChange={setReviewItems}
      />

      <Card
        title="Histórico de importações"
        subtitle="Arquivos processados e seus respectivos status."
      >
        {loading ? (
          <p className="dashboard-subtitle">
            Carregando importações...
          </p>
        ) : imports.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Nenhuma importação registrada"
            description="Os lotes importados aparecerão aqui."
          />
        ) : (
          <div className="imports-history-list">
            {imports.map((item) => (
              <div
                key={item.id}
                className="imports-history-row"
              >
                <div className="imports-history-file">
                  <div className="imports-history-icon">
                    <FileSpreadsheet size={18} />
                  </div>

                  <div>
                    <span>
                      {item.source.toUpperCase()}
                    </span>

                    <strong>
                      {item.file_name}
                    </strong>
                  </div>
                </div>

                <div className="imports-history-metrics">
                  <span>
                    Encontradas:{' '}
                    <strong>
                      {item.total_transactions}
                    </strong>
                  </span>

                  <span>
                    Importadas:{' '}
                    <strong>
                      {item.imported_transactions}
                    </strong>
                  </span>

                  <span className={`imports-status ${item.status}`}>
                    {item.status}
                  </span>
                </div>

                <button
                  type="button"
                  className="delete-btn"
                  disabled={
                    deletingId === item.id
                  }
                  onClick={() =>
                    handleDeleteImport(
                      item.id,
                    )
                  }
                  title="Excluir lote e transações"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

type ColumnSelectProps = {
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
};

function ColumnSelect({
  label,
  value,
  headers,
  onChange,
}: ColumnSelectProps) {
  return (
    <label className="planning-input-field">
      <span className="planning-input-label">
        {label}
      </span>

      <select
        className="filter-select imports-select"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        <option value="">
          Selecione uma coluna
        </option>

        {headers.map((header) => (
          <option
            key={header}
            value={header}
          >
            {header}
          </option>
        ))}
      </select>
    </label>
  );
}

type ImportSummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon:
    | 'list'
    | 'income'
    | 'expense'
    | 'shield';
};

function ImportSummaryCard({
  label,
  value,
  description,
  icon,
}: ImportSummaryCardProps) {
  function renderIcon() {
    if (icon === 'income') {
      return <ArrowUpCircle size={20} />;
    }

    if (icon === 'expense') {
      return <ArrowDownCircle size={20} />;
    }

    if (icon === 'shield') {
      return <ShieldCheck size={20} />;
    }

    return <ListChecks size={20} />;
  }

  return (
    <div className="imports-summary-card">
      <div className="imports-summary-top">
        <div className="imports-summary-icon">
          {renderIcon()}
        </div>

        <span>
          {label}
        </span>
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

type ImportInsightProps = {
  tone:
    | 'success'
    | 'warning'
    | 'neutral';
  title: string;
  description: string;
};

function ImportInsight({
  tone,
  title,
  description,
}: ImportInsightProps) {
  return (
    <div className={`imports-insight ${tone}`}>
      <div className="imports-insight-icon">
        {tone === 'success' && (
          <CheckCircle2 size={18} />
        )}

        {tone === 'warning' && (
          <AlertTriangle size={18} />
        )}

        {tone === 'neutral' && (
          <Sparkles size={18} />
        )}
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}
