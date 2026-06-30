import LoadingButton from './LoadingButton';

import type {
  TransactionType,
} from '../types/transaction';

interface Props {
  showModal: boolean;

  editId: number | null;

  title: string;

  value: string;

  type: TransactionType;

  category: string;

  date: string;

  categories: string[];

  isSaving?: boolean;

  onClose: () => void;

  onTitleChange: (
    value: string,
  ) => void;

  onValueChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;

  onTypeChange: (
    value: TransactionType,
  ) => void;

  onCategoryChange: (
    value: string,
  ) => void;

  onDateChange: (
    value: string,
  ) => void;

  onSave: () => void;
}

export default function TransactionModal({
  showModal,
  editId,
  title,
  value,
  type,
  category,
  date,
  categories,
  isSaving = false,
  onClose,
  onTitleChange,
  onValueChange,
  onTypeChange,
  onCategoryChange,
  onDateChange,
  onSave,
}: Props) {
  if (!showModal)
    return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>
          {editId
            ? 'Editar transação'
            : 'Nova transação'}
        </h2>

        <input
          placeholder="Descrição"
          value={title}
          disabled={isSaving}
          onChange={(e) =>
            onTitleChange(
              e.target.value,
            )
          }
        />

        <input
          placeholder="R$ 0,00"
          value={value}
          disabled={isSaving}
          onChange={
            onValueChange
          }
        />

        <input
          type="date"
          value={date}
          disabled={isSaving}
          onChange={(e) =>
            onDateChange(
              e.target.value,
            )
          }
        />

        <select
          value={type}
          disabled={isSaving}
          onChange={(e) =>
            onTypeChange(
              e.target
                .value as TransactionType,
            )
          }
        >
          <option value="expense">
            Despesa
          </option>

          <option value="income">
            Receita
          </option>
        </select>

        <select
          value={category}
          disabled={isSaving}
          onChange={(e) =>
            onCategoryChange(
              e.target.value,
            )
          }
        >
          {categories.map(
            (cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ),
          )}
        </select>

        <div className="modal-actions">
          <button
            className="secondary-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>

          <LoadingButton
            className="primary-btn"
            onClick={onSave}
            isLoading={isSaving}
          >
            {isSaving
              ? 'Salvando...'
              : editId
                ? 'Salvar edição'
                : 'Salvar'}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}