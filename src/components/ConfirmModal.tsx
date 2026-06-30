import {
  useEffect,
  useRef,
} from 'react';

type Props = {
  open: boolean;

  title: string;

  description: string;

  confirmText?: string;

  cancelText?: string;

  loading?: boolean;

  onConfirm: () => void;

  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  useEffect(() => {
    if (!open)
      return;

    cancelButtonRef.current?.focus();

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape' &&
        !loading
      ) {
        onCancel();
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    open,
    loading,
    onCancel,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={() => {
        if (!loading) {
          onCancel();
        }
      }}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <h2 id="confirm-modal-title">
          {title}
        </h2>

        <p
          id="confirm-modal-description"
          className="delete-text"
        >
          {description}
        </p>

        <div className="modal-actions">
          <button
            ref={cancelButtonRef}
            className="secondary-btn"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            className="danger-btn"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading
              ? 'Processando...'
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}