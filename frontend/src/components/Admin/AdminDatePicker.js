import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import './AdminDatePicker.css';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseISO = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmt = (str) => {
  if (!str) return '';
  const d = parseISO(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminDatePicker = ({ value, onChange, placeholder = 'mm/dd/yyyy', minDate, maxDate }) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? parseISO(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef(null);

  // Update viewDate when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseISO(value);
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const today = toISO(new Date());
  const maxISO = maxDate || today;
  const minISO = minDate || null;

  const buildCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  };

  const handleDay = (d) => {
    const iso = toISO(d);
    if (maxISO && iso > maxISO) return;
    if (minISO && iso < minISO) return;
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => { onChange(''); setOpen(false); };
  const handleToday = () => {
    if (minISO && today < minISO) return;
    if (maxISO && today > maxISO) return;
    onChange(today);
    setOpen(false);
  };

  const cells = buildCells();
  const canGoPrev = !minISO || new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1) >= new Date(minISO.split('-')[0], minISO.split('-')[1] - 2, 1);
  const canGoNext = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) <= new Date(maxISO.split('-')[0], parseInt(maxISO.split('-')[1]) - 1, 1);

  return (
    <div className="adp-container" ref={containerRef}>
      <button
        type="button"
        className={`adp-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`adp-value${!value ? ' placeholder' : ''}`}>
          {value ? fmt(value) : placeholder}
        </span>
        <span className="adp-icons">
          {value && (
            <span
              className="adp-clear-btn"
              onMouseDown={e => { e.stopPropagation(); handleClear(); }}
            >
              <X size={12} />
            </span>
          )}
          <CalendarDays size={14} className="adp-cal-icon" />
        </span>
      </button>

      {open && (
        <div className="adp-popup">
          {/* Header */}
          <div className="adp-header">
            <button type="button" className="adp-nav" onClick={prevMonth} disabled={!canGoPrev}>
              <ChevronLeft size={15} />
            </button>
            <span className="adp-month-label">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" className="adp-nav" onClick={nextMonth} disabled={!canGoNext}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="adp-grid">
            {DAYS.map(d => <span key={d} className="adp-dow">{d}</span>)}

            {cells.map((d, i) => {
              if (!d) return <span key={`e-${i}`} />;
              const iso = toISO(d);
              const isSelected = iso === value;
              const isToday = iso === today;
              const disabled = (maxISO && iso > maxISO) || (minISO && iso < minISO);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`adp-day${isSelected ? ' selected' : ''}${isToday && !isSelected ? ' today' : ''}${disabled ? ' disabled' : ''}`}
                  onClick={() => handleDay(d)}
                  disabled={disabled}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="adp-footer">
            <button type="button" className="adp-foot-btn" onClick={handleClear}>Clear</button>
            <button
              type="button"
              className="adp-foot-btn accent"
              onClick={handleToday}
              disabled={!!minISO && today < minISO}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatePicker;
