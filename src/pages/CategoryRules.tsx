import {
    useMemo,
    useState,
  } from 'react';
  
  import {
    Search,
    Trash2,
    Save,
    Wand2,
    Pencil,
    X,
  } from 'lucide-react';
  
  import Card from '../components/Card';
  import EmptyState from '../components/EmptyState';
  import LoadingButton from '../components/LoadingButton';
  import ConfirmModal from '../components/ConfirmModal';
  
  import { useCategoryRules } from '../hook/useCategoryRules';
  
  import {
    mergeCategories,
  } from '../utils/categories/defaultCategories';
  
  import type {
    CategoryRule,
  } from '../types/categoryRule';
  
  const fallbackCategories =
    mergeCategories([]);
  
  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      'pt-BR',
    );
  }
  
  export default function CategoryRules() {
    const {
      rules,
      isLoading,
      createRule,
      updateRule,
      removeRule,
    } = useCategoryRules();
  
    const [search, setSearch] =
      useState('');
  
    const [
      newKeyword,
      setNewKeyword,
    ] = useState('');
  
    const [
      newCategory,
      setNewCategory,
    ] = useState(
      fallbackCategories[0] ??
        'Sem categoria',
    );
  
    const [
      editingRule,
      setEditingRule,
    ] = useState<CategoryRule | null>(
      null,
    );
  
    const [
      editKeyword,
      setEditKeyword,
    ] = useState('');
  
    const [
      editCategory,
      setEditCategory,
    ] = useState('');
  
    const [
      deletingRule,
      setDeletingRule,
    ] = useState<CategoryRule | null>(
      null,
    );
  
    const [saving, setSaving] =
      useState(false);
  
    const [
      deleting,
      setDeleting,
    ] = useState(false);
  
    const categoryOptions =
      useMemo(() => {
        const ruleCategories =
          rules.map((rule) =>
            rule.category,
          );
  
        return mergeCategories(
          ruleCategories,
        );
      }, [rules]);
  
    const filteredRules =
      rules.filter((rule) => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();
  
        if (!normalizedSearch) {
          return true;
        }
  
        return (
          rule.keyword
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          rule.category
            .toLowerCase()
            .includes(
              normalizedSearch,
            )
        );
      });
  
    function startEditing(
      rule: CategoryRule,
    ) {
      setEditingRule(rule);
      setEditKeyword(rule.keyword);
      setEditCategory(rule.category);
    }
  
    function cancelEditing() {
      setEditingRule(null);
      setEditKeyword('');
      setEditCategory('');
    }
  
    async function handleCreateRule() {
      if (
        !newKeyword.trim() ||
        !newCategory
      ) {
        return;
      }
  
      setSaving(true);
  
      try {
        const created =
          await createRule({
            keyword:
              newKeyword.trim(),
  
            category:
              newCategory,
          });
  
        if (created) {
          setNewKeyword('');
        }
      } finally {
        setSaving(false);
      }
    }
  
    async function handleUpdateRule() {
      if (
        !editingRule ||
        !editKeyword.trim() ||
        !editCategory
      ) {
        return;
      }
  
      setSaving(true);
  
      try {
        const updated =
          await updateRule(
            editingRule.id,
            {
              keyword:
                editKeyword.trim(),
  
              category:
                editCategory,
            },
          );
  
        if (updated) {
          cancelEditing();
        }
      } finally {
        setSaving(false);
      }
    }
  
    async function handleRemoveRule() {
      if (!deletingRule) {
        return;
      }
  
      setDeleting(true);
  
      try {
        await removeRule(
          deletingRule.id,
        );
  
        setDeletingRule(null);
      } finally {
        setDeleting(false);
      }
    }
  
    return (
      <div>
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Regras Inteligentes
          </h1>
  
          <p className="dashboard-subtitle">
            Gerencie as regras que o MyFlow usa para classificar automaticamente suas próximas importações.
          </p>
        </div>
  
        <div className="planning-metrics-grid">
          <MetricCard
            label="Regras ativas"
            value={String(rules.length)}
            description="Aprendizados salvos pelo usuário."
          />
  
          <MetricCard
            label="Categorias usadas"
            value={String(
              new Set(
                rules.map(
                  (rule) =>
                    rule.category,
                ),
              ).size,
            )}
            description="Categorias presentes nas regras."
          />
  
          <MetricCard
            label="Resultado"
            value="Custo zero"
            description="Classificação local, sem IA paga."
          />
        </div>
  
        <Card
          title="Nova regra"
          subtitle="Crie uma regra manual para melhorar as próximas importações."
        >
          <div className="planning-form">
            <div className="planning-input-grid two">
              <label className="planning-input-field">
                <span className="planning-input-label">
                  Palavra-chave
                </span>
  
                <input
                  className="search-input"
                  placeholder="Ex: atacadão, sem parar, ifood"
                  value={newKeyword}
                  onChange={(event) =>
                    setNewKeyword(
                      event.target.value,
                    )
                  }
                />
              </label>
  
              <label className="planning-input-field">
                <span className="planning-input-label">
                  Categoria
                </span>
  
                <select
                  className="filter-select"
                  value={newCategory}
                  onChange={(event) =>
                    setNewCategory(
                      event.target.value,
                    )
                  }
                >
                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
  
            <div className="planning-actions">
              <LoadingButton
                className="primary-btn"
                isLoading={saving}
                onClick={handleCreateRule}
              >
                <Wand2 size={18} />
                {saving
                  ? 'Salvando...'
                  : 'Criar regra'}
              </LoadingButton>
            </div>
          </div>
        </Card>
  
        <Card
          title="Regras cadastradas"
          subtitle="Edite ou remova regras aprendidas pelo MyFlow."
        >
          <div className="filters-wrapper">
            <div
              style={{
                position: 'relative',
                flex: 1,
              }}
            >
              <Search
                size={17}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  opacity: 0.55,
                }}
              />
  
              <input
                className="search-input"
                placeholder="Buscar por palavra-chave ou categoria..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                style={{
                  paddingLeft: 42,
                }}
              />
            </div>
  
            {search && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setSearch('')
                }
              >
                Limpar busca
              </button>
            )}
          </div>
  
          {isLoading ? (
            <p className="dashboard-subtitle">
              Carregando regras...
            </p>
          ) : filteredRules.length === 0 ? (
            <EmptyState
              icon="✨"
              title={
                rules.length === 0
                  ? 'Nenhuma regra inteligente criada'
                  : 'Nenhuma regra encontrada'
              }
              description={
                rules.length === 0
                  ? 'As regras aparecerão aqui quando você corrigir uma categoria durante uma importação ou criar uma regra manual.'
                  : 'Tente buscar por outro estabelecimento ou categoria.'
              }
            />
          ) : (
            <div className="planning-form">
              {filteredRules.map((rule) => {
                const isEditing =
                  editingRule?.id === rule.id;
  
                return (
                  <div
                    key={rule.id}
                    className="planning-metric-card"
                    style={{
                      display: 'grid',
                      gap: 14,
                    }}
                  >
                    {isEditing ? (
                      <div className="planning-form">
                        <div className="planning-input-grid two">
                          <label className="planning-input-field">
                            <span className="planning-input-label">
                              Palavra-chave
                            </span>
  
                            <input
                              className="search-input"
                              value={editKeyword}
                              onChange={(event) =>
                                setEditKeyword(
                                  event.target.value,
                                )
                              }
                            />
                          </label>
  
                          <label className="planning-input-field">
                            <span className="planning-input-label">
                              Categoria
                            </span>
  
                            <select
                              className="filter-select"
                              value={editCategory}
                              onChange={(event) =>
                                setEditCategory(
                                  event.target.value,
                                )
                              }
                            >
                              {categoryOptions.map(
                                (category) => (
                                  <option
                                    key={category}
                                    value={category}
                                  >
                                    {category}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>
  
                        <div className="planning-actions">
                          <LoadingButton
                            className="primary-btn"
                            isLoading={saving}
                            onClick={
                              handleUpdateRule
                            }
                          >
                            <Save size={18} />
                            {saving
                              ? 'Salvando...'
                              : 'Salvar alteração'}
                          </LoadingButton>
  
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={
                              cancelEditing
                            }
                          >
                            <X size={18} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="planning-metric-top">
                          <div>
                            <span className="planning-metric-label">
                              Palavra-chave
                            </span>
  
                            <strong className="planning-metric-value">
                              {rule.keyword}
                            </strong>
                          </div>
  
                          <span className="category-badge">
                            {rule.category}
                          </span>
                        </div>
  
                        <p className="planning-metric-description">
                          Criada em{' '}
                          <strong>
                            {formatDate(
                              rule.createdAt,
                            )}
                          </strong>
                          . Toda transação que contiver essa palavra será classificada como{' '}
                          <strong>
                            {rule.category}
                          </strong>
                          .
                        </p>
  
                        <div className="planning-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() =>
                              startEditing(rule)
                            }
                          >
                            <Pencil size={18} />
                            Editar
                          </button>
  
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              setDeletingRule(
                                rule,
                              )
                            }
                            style={{
                              height: 40,
                              padding:
                                '0 14px',
                            }}
                          >
                            <Trash2 size={18} />
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
  
        <ConfirmModal
          open={Boolean(deletingRule)}
          title="Excluir regra inteligente?"
          description={
            deletingRule
              ? `A regra "${deletingRule.keyword}" deixará de classificar automaticamente novas transações.`
              : 'Essa ação não pode ser desfeita.'
          }
          confirmText="Excluir regra"
          cancelText="Cancelar"
          loading={deleting}
          onCancel={() =>
            setDeletingRule(null)
          }
          onConfirm={handleRemoveRule}
        />
      </div>
    );
  }
  
  type MetricCardProps = {
    label: string;
    value: string;
    description: string;
  };
  
  function MetricCard({
    label,
    value,
    description,
  }: MetricCardProps) {
    return (
      <div className="planning-metric-card">
        <div className="planning-metric-top">
          <div>
            <span className="planning-metric-label">
              {label}
            </span>
  
            <strong className="planning-metric-value">
              {value}
            </strong>
          </div>
        </div>
  
        <p className="planning-metric-description">
          {description}
        </p>
      </div>
    );
  }