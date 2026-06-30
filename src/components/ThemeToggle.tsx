type Props = {
    darkMode: boolean;
    onToggle: () => void;
    disabled?: boolean;
  };
  
  export default function ThemeToggle({
    darkMode,
    onToggle,
    disabled = false,
  }: Props) {
    return (
      <button
        type="button"
        className={`theme-toggle ${
          darkMode ? 'dark' : 'light'
        }`}
        onClick={onToggle}
        disabled={disabled}
        aria-label={
          darkMode
            ? 'Ativar modo claro'
            : 'Ativar modo escuro'
        }
        title={
          darkMode
            ? 'Ativar modo claro'
            : 'Ativar modo escuro'
        }
      >
        <span className="theme-toggle-icon theme-toggle-sun">
          ☀
        </span>
  
        <span className="theme-toggle-icon theme-toggle-moon">
          ☾
        </span>
  
        <span className="theme-toggle-thumb" />
      </button>
    );
  }