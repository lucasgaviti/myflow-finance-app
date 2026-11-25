import { Moon, Sun } from 'lucide-react';

type Props = { darkMode: boolean; onToggle: () => void; disabled?: boolean };

export default function ThemeToggle({ darkMode, onToggle, disabled = false }: Props) {
  const label = darkMode ? 'Ativar modo claro' : 'Ativar modo escuro';
  return (
    <button type="button" className="theme-toggle" onClick={onToggle} disabled={disabled}
      aria-label={label} title={label} aria-pressed={darkMode}>
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
