import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { title: string; children: ReactNode; onClose: () => void; busy?: boolean; drawer?: boolean };
export default function WorkspaceDialog({ title, children, onClose, busy = false, drawer = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`workspace-dialog ${drawer ? 'drawer' : ''}`} aria-label={title}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="workspace-dialog-inner">
      <header className="workspace-dialog-header"><h2>{title}</h2><button type="button" className="icon-btn" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={19}/></button></header>
      {children}
    </div>
  </dialog>;
}
