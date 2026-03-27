import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import './CheckoutDatePicker.css';

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const CheckoutDatePicker = ({ value, onChange, placeholder = 'Select a date', minDate, maxDate }) => {
  const [open, setOpen]         = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? parseISO(value) : (minDate ? parseISO(minDate) : new Date());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const triggerRef  = useRef(null);
  const containerRef = useRef(null);

  // Sync viewDate when minDate/value change
  useEffect(() => {
    if (value) {
      const d = parseISO(value);
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (minDate) {
      const d = parseISO(minDate);
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value, minDate]);

  // Position popup fixed relative to trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popupH = 320;
    if (spaceBelow >= popupH) {
      setPopupStyle({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 272) });
    } else {
      setPopupStyle({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: Math.max(rect.width, 272) });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const today  = toISO(new Date());
  const maxISO = maxDate || null;
  const minISO = minDate || null;

  const buildCells = () => {
    const year     = viewDate.getFullYear();
    const month    = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const canGoPrev = !minISO || new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 28) >= parseISO(minISO);
  const canGoNext = !maxISO || new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) <= new Date(parseISO(maxISO).getFullYear(), parseISO(maxISO).getMonth(), 1);

  const handleDay = (d) => {
    const iso = toISO(d);
    if (maxISO && iso > maxISO) return;
    if (minISO && iso < minISO) return;
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => { onChange(''); setOpen(false); };

  const handleToday = () => {
    if ((minISO && today < minISO) || (maxISO && today > maxISO)) return;
    onChange(today);
    setOpen(false);
  };

  const todayDisabled = (minISO && today < minISO) || (maxISO && today > maxISO);
  const cells = buildCells();

  return (
    <div className="cdp-container">
      <button
        ref={triggerRef}
        type="button"
        className={`cdp-trigger${open ? ' open' : ''}${!value ? ' empty' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <CalendarDays size={15} className="cdp-cal-icon" />
        <span className={`cdp-value${!value ? ' placeholder' : ''}`}>
          {value ? fmt(value) : placeholder}
        </span>
        {value && (
          <span
            className="cdp-clear-btn"
            onMouseDown={e => { e.stopPropagation(); handleClear(); }}
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div
          ref={containerRef}
          className="cdp-popup"
          style={{ position: 'fixed', zIndex: 9999, ...popupStyle }}
        >
          {/* Header */}
          <div className="cdp-header">
            <button type="button" className="cdp-nav" onClick={prevMonth} disabled={!canGoPrev}>
              <ChevronLeft size={15} />
            </button>
            <span className="cdp-month-label">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" className="cdp-nav" onClick={nextMonth} disabled={!canGoNext}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="cdp-grid">
            {DAYS.map(d => <span key={d} className="cdp-dow">{d}</span>)}
            {cells.map((d, i) => {
              if (!d) return <span key={`e-${i}`} />;
              const iso = toISO(d);
              const isSelected = iso === value;
              const isToday    = iso === today;
              const disabled   = (maxISO && iso > maxISO) || (minISO && iso < minISO);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`cdp-day${isSelected ? ' selected' : ''}${isToday && !isSelected ? ' today' : ''}${disabled ? ' disabled' : ''}`}
                  onClick={() => handleDay(d)}
                  disabled={disabled}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="cdp-footer">
            <button type="button" className="cdp-foot-btn" onClick={handleClear}>Clear</button>
            <button
              type="button"
              className={`cdp-foot-btn accent${todayDisabled ? ' disabled' : ''}`}
              onClick={handleToday}
              disabled={todayDisabled}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutDatePicker;
