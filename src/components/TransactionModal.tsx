import LoadingButton from './LoadingButton';

import type { ChangeEvent, FormEvent } from 'react';
import type { TransactionType } from '../types/transaction';

type TransactionModalProps = {
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
  onTitleChange: (value: string) => void;
  onValueChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (value: TransactionType) => void;
  onCategoryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSave: () => void;
};

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
}: TransactionModalProps) {
  if (!showModal) {
    return null;
  }

  const isEditing = editId !== null;
  const isFormInvalid = !title.trim() || !value.trim() || !date;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving || isFormInvalid) {
      return;
    }

    onSave();
  }

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleOverlayClick() {
    handleClose();
  }

  function handleModalClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        onClick={handleModalClick}
      >
        <div className="modal-header">
          <div>
            <span className="goal-eyebrow">Transação</span>

            <h2 id="transaction-modal-title">
              {isEditing ? 'Editar transação' : 'Nova transação'}
            </h2>
          </div>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Descrição
            <input
              type="text"
              placeholder="Ex: Mercado, salário, combustível..."
              value={title}
              disabled={isSaving}
              autoFocus
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </label>

          <label>
            Valor
            <input
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={value}
              disabled={isSaving}
              onChange={onValueChange}
            />
          </label>

          <label>
            Data
            <input
              type="date"
              value={date}
              disabled={isSaving}
              onChange={(event) => onDateChange(event.target.value)}
            />
          </label>

          <label>
            Tipo
            <select
              value={type}
              disabled={isSaving}
              onChange={(event) =>
                onTypeChange(event.target.value as TransactionType)
              }
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </label>

          <label>
            Categoria
            <select
              value={category}
              disabled={isSaving}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              disabled={isSaving}
              onClick={handleClose}
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
                : isEditing
                  ? 'Salvar edição'
                  : 'Salvar'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}