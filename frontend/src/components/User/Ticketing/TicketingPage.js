import React, { useState, useMemo } from 'react';
import './TicketingPage.css';
import {
  CalendarDays, Users, Sparkles, ShieldCheck,
  CheckCircle2, ShoppingCart, ChevronLeft, ChevronRight,
  MapPin, Clock, Ticket
} from 'lucide-react';

/* ─────────────────────────────────
   Data
───────────────────────────────── */
const TICKET_TYPES = [
  {
    id: 'general',
    name: 'General Admission',
    desc: 'Full day access to all exhibits and daily shows.',
    prices: { adult: 29.99, child: 19.99, senior: 24.99 },
    popular: false,
    includes: [],
  },
  {
    id: 'premium',
    name: 'Premium Experience',
    desc: 'Skip the line and enjoy exclusive perks.',
    prices: { adult: 49.99, child: 34.99, senior: 44.99 },
    popular: true,
    includes: [
      'Everything in General Admission',
      'Skip-the-line access',
      'Reserved seating at shows',
      'Free visit & carousel rides',
      '10% off dining & gifts',
      'Complimentary parking',
    ],
  },
  {
    id: 'vip',
    name: 'VIP Safari',
    desc: 'The ultimate zoo experience with behind-the-scenes access.',
    prices: { adult: 109.99, child: 79.99, senior: 89.99 },
    popular: false,
    includes: [],
  },
];

const ADDONS = [
  { id: 'parking',  name: 'Preferred Parking',  desc: 'Close to entrance',      price: 10 },
  { id: 'train',    name: 'Train Kids Pass',     desc: '1-day train ride',        price: 8  },
  { id: 'carousel', name: 'Carousel Ride',       desc: 'Unlimited rides',         price: 6  },
  { id: 'feeding',  name: 'Animal Feeding',      desc: 'Giraffe & goat feeding',  price: 15 },
  { id: 'photo',    name: 'Photo Package',       desc: '3 printed photos + digital', price: 25 },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─────────────────────────────────
   Helpers
───────────────────────────────── */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function formatDisplayDate(y, m, d) {
  return new Date(y, m, d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

/* ─────────────────────────────────
   Component
───────────────────────────────── */
const TicketingPage = () => {
  const today = new Date();

  // Calendar state
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selDay,   setSelDay]   = useState(today.getDate());

  // Ticket selection
  const [ticketType, setTicketType] = useState('premium');

  // Guests
  const [guests, setGuests] = useState({ adult: 2, child: 0, senior: 0 });

  // Add-ons
  const [selectedAddons, setSelectedAddons] = useState({});

  /* ─── Calendar navigation ─── */
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDayOfMonth(calYear, calMonth);

  /* ─── Totals ─── */
  const ticket = TICKET_TYPES.find(t => t.id === ticketType);

  const ticketTotal = useMemo(() => {
    if (!ticket) return 0;
    return (
      guests.adult  * ticket.prices.adult  +
      guests.child  * ticket.prices.child  +
      guests.senior * ticket.prices.senior
    );
  }, [ticket, guests]);

  const addonTotal = useMemo(() => {
    const totalGuests = guests.adult + guests.child + guests.senior || 1;
    return Object.entries(selectedAddons)
      .filter(([, v]) => v)
      .reduce((sum, [id]) => {
        const a = ADDONS.find(x => x.id === id);
        return sum + (a ? a.price * totalGuests : 0);
      }, 0);
  }, [selectedAddons, guests]);

  const grandTotal    = ticketTotal + addonTotal;
  const totalGuests   = guests.adult + guests.child + guests.senior;
  const selectedDate  = formatDisplayDate(calYear, calMonth, selDay);

  const toggleAddon = (id) =>
    setSelectedAddons(prev => ({ ...prev, [id]: !prev[id] }));

  const bump = (type, delta) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  /* ─── Build calendar cells ─── */
  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const isPast = (d) => {
    const cellDate = new Date(calYear, calMonth, d);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < todayDate;
  };

  /* ─── Render ─── */
  return (
    <div className="tickets-page">
      {/* Hero */}
      <section className="tickets-hero">
        <div className="tickets-hero-bg" />
        <div className="tickets-hero-content">
          <h1 className="tickets-hero-title">Buy Tickets</h1>
          <p className="tickets-hero-subtitle">Book online and save up to 15% on admission</p>
        </div>
      </section>

      {/* Body */}
      <div className="tickets-body">
        {/* ──── LEFT COLUMN ──── */}
        <div>
          {/* 1. Select Date */}
          <div className="tk-section">
            <div className="tk-section-header">
              <CalendarDays className="icon" size={18} />
              Select Date
            </div>

            {/* Month nav */}
            <div className="tk-calendar-nav">
              <button onClick={prevMonth}><ChevronLeft size={14} /></button>
              <span className="tk-cal-month">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth}><ChevronRight size={14} /></button>
            </div>

            {/* Day names */}
            <div className="tk-calendar-grid">
              {DAY_NAMES.map(n => (
                <div className="tk-cal-day-name" key={n}>{n}</div>
              ))}

              {/* Empty + day cells */}
              {calCells.map((d, idx) => {
                if (d === null) return <div className="tk-cal-day empty" key={`e${idx}`} />;
                const isToday   = calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();
                const isSelected = d === selDay && calYear === today.getFullYear() && calMonth === today.getMonth() + (calYear !== today.getFullYear() ? 0 : 0);
                const past = isPast(d);
                return (
                  <button
                    key={d}
                    className={`tk-cal-day${isToday && !isSelected ? ' today' : ''}${isSelected ? ' selected' : ''}${past ? ' disabled' : ''}`}
                    onClick={() => !past && setSelDay(d)}
                    disabled={past}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <div className="tk-zoo-hours">
              <Clock size={14} />
              {selectedDate} — Zoo open 9:00 AM – 9:00 PM
            </div>
          </div>

          {/* 2. Ticket Type */}
          <div className="tk-section">
            <div className="tk-section-header">
              <Ticket className="icon" size={18} />
              Choose Ticket Type
            </div>

            {TICKET_TYPES.map(t => (
              <div
                key={t.id}
                className={`tk-ticket-option${ticketType === t.id ? ' selected' : ''}`}
                onClick={() => setTicketType(t.id)}
              >
                <div className="tk-ticket-header">
                  <div>
                    <div className="tk-ticket-title-row">
                      <span className="tk-ticket-name">{t.name}</span>
                      {t.popular && (
                        <span className="tk-most-popular-badge">Most Popular</span>
                      )}
                    </div>
                    <p className="tk-ticket-desc">{t.desc}</p>
                    <div className="tk-ticket-prices">
                      <span>Adult: <strong>${t.prices.adult}</strong></span>
                      <span>Child: <strong>${t.prices.child}</strong></span>
                      <span>Senior: <strong>${t.prices.senior}</strong></span>
                    </div>
                  </div>
                  <div className="tk-radio">
                    {ticketType === t.id && <div className="tk-radio-dot" />}
                  </div>
                </div>

                {/* Includes list (only when selected & has items) */}
                {ticketType === t.id && t.includes.length > 0 && (
                  <div className="tk-includes">
                    {t.includes.map(item => (
                      <div className="tk-include-item" key={item}>
                        <CheckCircle2 size={13} />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 3. Guests */}
          <div className="tk-section">
            <div className="tk-section-header">
              <Users className="icon" size={18} />
              Number of Guests
            </div>

            <div className="tk-guests-list">
              {[
                { key: 'adult',  label: 'Adults',   sub: `13-64 · $${ticket?.prices.adult ?? 0}/each`   },
                { key: 'child',  label: 'Children',  sub: `2-12 · $${ticket?.prices.child ?? 0}/each`   },
                { key: 'senior', label: 'Seniors',   sub: `65+ · $${ticket?.prices.senior ?? 0}/each`   },
              ].map(({ key, label, sub }) => (
                <div className="tk-guest-row" key={key}>
                  <div className="tk-guest-info">
                    <div className="tk-guest-label">{label}</div>
                    <div className="tk-guest-sub">{sub}</div>
                  </div>
                  <div className="tk-counter">
                    <button
                      className="tk-counter-btn"
                      onClick={() => bump(key, -1)}
                      disabled={guests[key] === 0}
                    >−</button>
                    <span className="tk-counter-val">{guests[key]}</span>
                    <button
                      className="tk-counter-btn"
                      onClick={() => bump(key, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="tk-guest-note">ⓘ Children under 2 are free and don't need a ticket.</p>
          </div>

          {/* 4. Add-ons */}
          <div className="tk-section">
            <div className="tk-section-header">
              <Sparkles className="icon" size={18} />
              Enhance Your Visit
            </div>

            <div className="tk-addons-grid">
              {ADDONS.map(a => (
                <div
                  key={a.id}
                  className={`tk-addon-card${selectedAddons[a.id] ? ' selected' : ''}`}
                  onClick={() => toggleAddon(a.id)}
                >
                  <div className="tk-addon-info">
                    <div className="tk-addon-name">{a.name}</div>
                    <div className="tk-addon-desc">{a.desc}</div>
                  </div>
                  <div className="tk-addon-price">+${a.price}</div>
                </div>
              ))}
            </div>
            <p className="tk-addons-note">Add-on prices are per person.</p>
          </div>
        </div>

        {/* ──── RIGHT COLUMN — Order Summary ──── */}
        <div className="tk-order-summary">
          <h3 className="tk-order-title">Order Summary</h3>

          {/* Date */}
          <div className="tk-order-date-box">
            <div className="tk-order-date-label">Visit Date</div>
            <div className="tk-order-date-val">{selectedDate}</div>
          </div>

          {/* Line items */}
          <div className="tk-order-items">
            <div className="tk-order-item">
              <div>
                <div className="tk-order-item-label">{ticket?.name}</div>
                {guests.adult  > 0 && <div className="tk-order-item-sub">{guests.adult}× Adult</div>}
                {guests.child  > 0 && <div className="tk-order-item-sub">{guests.child}× Child</div>}
                {guests.senior > 0 && <div className="tk-order-item-sub">{guests.senior}× Senior</div>}
              </div>
              <div className="tk-order-item-price">${ticketTotal.toFixed(2)}</div>
            </div>

            {/* Add-ons */}
            {Object.entries(selectedAddons).filter(([,v]) => v).map(([id]) => {
              const a = ADDONS.find(x => x.id === id);
              const perPerson = (guests.adult + guests.child + guests.senior) || 1;
              return a ? (
                <div className="tk-order-item" key={id}>
                  <div className="tk-order-item-label">{a.name}</div>
                  <div className="tk-order-item-price">
                    +${(a.price * perPerson).toFixed(2)}
                  </div>
                </div>
              ) : null;
            })}
          </div>

          <hr className="tk-order-divider" />

          <div className="tk-order-total">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="tk-order-total-sub">
            {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
          </div>

          <button className="tk-checkout-btn">
            <ShoppingCart size={16} />
            Checkout
          </button>

          <div className="tk-order-perks">
            <div className="tk-order-perk">
              <ShieldCheck size={14} />
              Secure checkout
            </div>
            <div className="tk-order-perk">
              <CheckCircle2 size={14} />
              Free email ticketing up to 20 min before
            </div>
            <div className="tk-order-perk">
              <CheckCircle2 size={14} />
              Mobile tickets — no printing needed
            </div>
          </div>
        </div>
      </div>

      {/* Membership Banner */}
      <section className="tickets-membership-banner">
        <h3>Become a Member</h3>
        <p>Unlimited visits, exclusive events, and up to 20% off at shops and restaurants</p>
        <a href="/ticketing" className="tk-membership-btn">
          🪪 View Membership Options
        </a>
      </section>

    </div>
  );
};

export default TicketingPage;
