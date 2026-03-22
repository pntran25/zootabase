import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './AdminSelect.css';

/**
 * AdminSelect — themed dropdown matching the admin panel.
 *
 * Props:
 *   value        — current value
 *   onChange     — (value) => void
 *   options      — [{ value, label }] or ['string', ...]
 *   placeholder  — shown when no value selected
 *   disabled     — boolean
 */
const AdminSelect = ({ value, onChange, options = [], placeholder = 'Select...', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const normalized = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const selected = normalized.find(o => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`adm-sel-container${disabled ? ' adm-sel-disabled' : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`adm-sel-trigger${isOpen ? ' open' : ''}`}
        onClick={() => !disabled && setIsOpen(o => !o)}
        disabled={disabled}
      >
        <span className={`adm-sel-value${!selected ? ' placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={`adm-sel-chevron${isOpen ? ' rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="adm-sel-dropdown">
          {normalized.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`adm-sel-option${opt.value === value ? ' selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={13} className="adm-sel-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSelect;
