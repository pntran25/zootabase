import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './DatePickerInput.css';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function parseLocal(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplay(dateStr) {
  const d = parseLocal(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const DatePickerInput = ({ value, onChange, placeholder = 'Select date...', allowFuture = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = parseLocal(value);
    return d ? d.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseLocal(value);
    return d ? d.getMonth() : new Date().getMonth();
  });
  const containerRef = useRef(null);

  // Sync view when value changes externally
  useEffect(() => {
    const d = parseLocal(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedDate = parseLocal(value);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);
    if (!allowFuture && clicked > today) return;
    onChange(toDateStr(clicked));
    setIsOpen(false);
  };

  const isNextDisabled = !allowFuture && new Date(viewYear, viewMonth + 1, 1) > today;

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="adm-dp-container" ref={containerRef}>
      <div className="adm-dp-input-wrap" onClick={() => setIsOpen(o => !o)}>
        <span className="adm-dp-value">{value ? formatDisplay(value) : <span className="adm-dp-placeholder">{placeholder}</span>}</span>
        <Calendar size={15} className="adm-dp-icon" />
      </div>

      {isOpen && (
        <div className="adm-dp-popup">
          {/* Month navigation */}
          <div className="adm-dp-header">
            <button type="button" className="adm-dp-nav" onClick={prevMonth}><ChevronLeft size={15} /></button>
            <span className="adm-dp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="adm-dp-nav" onClick={nextMonth} disabled={isNextDisabled}><ChevronRight size={15} /></button>
          </div>

          {/* Day-of-week headers */}
          <div className="adm-dp-grid">
            {DAYS.map(d => <span key={d} className="adm-dp-dow">{d}</span>)}

            {/* Calendar cells */}
            {cells.map((day, i) => {
              if (day === null) return <span key={`e-${i}`} />;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isFuture = cellDate > today;
              const isDisabled = !allowFuture && isFuture;
              const isToday = cellDate.getTime() === today.getTime();
              const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();
              return (
                <button
                  key={day}
                  type="button"
                  className={`adm-dp-day${isSelected ? ' selected' : ''}${isToday && !isSelected ? ' today' : ''}${isDisabled ? ' disabled' : ''}`}
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="adm-dp-footer">
            <button type="button" className="adm-dp-clear" onClick={() => { onChange(''); setIsOpen(false); }}>Clear</button>
            <button type="button" className="adm-dp-today" onClick={() => { onChange(toDateStr(today)); setIsOpen(false); }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
