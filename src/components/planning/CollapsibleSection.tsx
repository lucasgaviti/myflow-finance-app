import {
    ChevronDown,
    ChevronRight,
  } from 'lucide-react';
  
  import {
    useState,
  } from 'react';
  
  import type {
    ReactNode,
  } from 'react';
  
  type Props = {
    title: string;
    subtitle?: string;
    defaultOpen?: boolean;
    children: ReactNode;
  };
  
  export default function CollapsibleSection({
    title,
    subtitle,
    defaultOpen = false,
    children,
  }: Props) {
    const [open, setOpen] =
      useState(defaultOpen);
  
    return (
      <section className="card">
        <button
          type="button"
          className="card-header"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
          }}
        >
          <div>
            <h3 className="card-title">
              {title}
            </h3>
  
            {subtitle && (
              <p className="card-subtitle">
                {subtitle}
              </p>
            )}
          </div>
  
          <div className="planning-metric-icon">
            {open ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </div>
        </button>
  
        {open && (
          <div className="card-content">
            {children}
          </div>
        )}
      </section>
    );
  }