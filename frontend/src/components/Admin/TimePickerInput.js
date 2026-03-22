import React, { useState, useEffect, useRef } from 'react';
import './TimePickerInput.css';
import { Clock, ChevronDown } from 'lucide-react';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function snapToFive(m) {
  return MINUTES.reduce((prev, curr) =>
    Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
  );
}

function parse24To12(value) {
  if (!value || !String(value).includes(':')) {
    return { hour: 12, minute: 0, period: 'AM' };
  }
  const [h, m] = String(value).split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: snapToFive(m || 0), period };
}

function to24(hour, minute, period) {
  let h = hour;
  if (period === 'AM' && hour === 12) h = 0;
  if (period === 'PM' && hour !== 12) h = hour + 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const TimePickerInput = ({ value, onChange, placeholder = 'Select time' }) => {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  const wrapperRef = useRef(null);
  const hourColRef = useRef(null);
  const minColRef = useRef(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const parsed = parse24To12(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Scroll selected items into view when opening
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      hourColRef.current?.querySelector('.tpi-option.selected')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      minColRef.current?.querySelector('.tpi-option.selected')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 40);
    return () => clearTimeout(timer);
  }, [open]);

  const emit = (h, m, p) => onChange(to24(h, m, p));

  const selectHour = (h) => { setHour(h); emit(h, minute, period); };
  const selectMinute = (m) => { setMinute(m); emit(hour, m, period); };
  const selectPeriod = (p) => { setPeriod(p); emit(hour, minute, p); };

  const hasValue = !!value;
  const displayHour = String(hour);
  const displayMinute = String(minute).padStart(2, '0');

  return (
    <div className="tpi-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`tpi-trigger${hasValue ? '' : ' tpi-trigger--empty'}`}
        onClick={() => setOpen(o => !o)}
      >
        <Clock size={14} className="tpi-clock-icon" />
        {hasValue ? (
          <span className="tpi-display">
            <span className="tpi-hm">{displayHour}</span>
            <span className="tpi-colon">:</span>
            <span className="tpi-hm">{displayMinute}</span>
            <span className="tpi-period-badge">{period}</span>
          </span>
        ) : (
          <span className="tpi-placeholder">{placeholder}</span>
        )}
        <ChevronDown size={13} className={`tpi-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="tpi-dropdown">
          {/* AM / PM row */}
          <div className="tpi-ampm-row">
            <button
              type="button"
              className={`tpi-period-btn${period === 'AM' ? ' active' : ''}`}
              onClick={() => selectPeriod('AM')}
            >AM</button>
            <button
              type="button"
              className={`tpi-period-btn${period === 'PM' ? ' active' : ''}`}
              onClick={() => selectPeriod('PM')}
            >PM</button>
          </div>

          {/* Hour : Minute columns */}
          <div className="tpi-columns">
            <div className="tpi-col-label">Hour</div>
            <div className="tpi-col-label"> </div>
            <div className="tpi-col-label">Min</div>

            <div className="tpi-column" ref={hourColRef}>
              {HOURS.map(h => (
                <div
                  key={h}
                  className={`tpi-option${h === hour ? ' selected' : ''}`}
                  onClick={() => selectHour(h)}
                >
                  {h}
                </div>
              ))}
            </div>

            <div className="tpi-separator">:</div>

            <div className="tpi-column" ref={minColRef}>
              {MINUTES.map(m => (
                <div
                  key={m}
                  className={`tpi-option${m === minute ? ' selected' : ''}`}
                  onClick={() => selectMinute(m)}
                >
                  {String(m).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePickerInput;
