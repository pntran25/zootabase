import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import './TimePickerInput.css'; // reuses .tpi-* styles

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1929 }, (_, i) => CURRENT_YEAR - i);

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-indexed
}

function parseValue(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

const DEFAULT_YEAR  = CURRENT_YEAR - 30;
const DEFAULT_MONTH = 1;
const DEFAULT_DAY   = 1;

const BirthDatePickerInput = ({ value, onChange, placeholder = 'Select date of birth' }) => {
  const parsed = parseValue(value);
  const [year,  setYear]  = useState(parsed?.year  ?? DEFAULT_YEAR);
  const [month, setMonth] = useState(parsed?.month ?? DEFAULT_MONTH);
  const [day,   setDay]   = useState(parsed?.day   ?? DEFAULT_DAY);
  const [open,  setOpen]  = useState(false);

  const wrapperRef  = useRef(null);
  const yearColRef  = useRef(null);
  const monthColRef = useRef(null);
  const dayColRef   = useRef(null);

  // Sync when external value changes
  useEffect(() => {
    const p = parseValue(value);
    if (p) { setYear(p.year); setMonth(p.month); setDay(p.day); }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll selected items into view when opening
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      yearColRef.current?.querySelector('.tpi-option.selected')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      monthColRef.current?.querySelector('.tpi-option.selected')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      dayColRef.current?.querySelector('.tpi-option.selected')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 40);
    return () => clearTimeout(t);
  }, [open]);

  const daysInMonth = getDaysInMonth(year, month);
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const safeDay = Math.min(day, daysInMonth);

  const emit = (y, m, d) => {
    const clampedDay = Math.min(d, getDaysInMonth(y, m));
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`);
  };

  const selectYear  = (y) => { setYear(y);  emit(y, month, safeDay); };
  const selectMonth = (m) => { setMonth(m); emit(year, m, safeDay); };
  const selectDay   = (d) => { setDay(d);   emit(year, month, d); };

  const hasValue   = !!value && !!parseValue(value);
  const displayText = hasValue ? `${MONTHS[month - 1]} ${safeDay}, ${year}` : null;

  return (
    <div className="tpi-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`tpi-trigger${!hasValue ? ' tpi-trigger--empty' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <Calendar size={14} className="tpi-clock-icon" />
        {hasValue
          ? <span className="tpi-placeholder" style={{ color: 'var(--adm-text-primary)', flex: 1 }}>{displayText}</span>
          : <span className="tpi-placeholder">{placeholder}</span>
        }
        <ChevronDown size={13} className={`tpi-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="tpi-dropdown" style={{ width: '100%', padding: '14px 12px 10px' }}>
          {/* Three columns: Year | Month | Day */}
          <div
            className="tpi-columns"
            style={{ gridTemplateColumns: '70px 14px 1fr 14px 50px', gridTemplateRows: 'auto 1fr' }}
          >
            {/* Labels */}
            <div className="tpi-col-label">Year</div>
            <div />
            <div className="tpi-col-label">Month</div>
            <div />
            <div className="tpi-col-label">Day</div>

            {/* Year column */}
            <div className="tpi-column" ref={yearColRef}>
              {YEARS.map(y => (
                <div
                  key={y}
                  className={`tpi-option${y === year ? ' selected' : ''}`}
                  onClick={() => selectYear(y)}
                >
                  {y}
                </div>
              ))}
            </div>

            <div className="tpi-separator" style={{ paddingTop: 28 }} />

            {/* Month column */}
            <div className="tpi-column" ref={monthColRef}>
              {MONTHS.map((name, i) => (
                <div
                  key={i + 1}
                  className={`tpi-option${i + 1 === month ? ' selected' : ''}`}
                  onClick={() => selectMonth(i + 1)}
                  style={{ textAlign: 'left', paddingLeft: 10 }}
                >
                  {name}
                </div>
              ))}
            </div>

            <div className="tpi-separator" style={{ paddingTop: 28 }} />

            {/* Day column */}
            <div className="tpi-column" ref={dayColRef}>
              {DAYS.map(d => (
                <div
                  key={d}
                  className={`tpi-option${d === safeDay ? ' selected' : ''}`}
                  onClick={() => selectDay(d)}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthDatePickerInput;
