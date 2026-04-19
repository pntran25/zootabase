import { useState, useEffect } from 'react';
import { Lock, X, Users, Minus, Plus } from 'lucide-react';
import CheckoutDatePicker from './CheckoutDatePicker';
import { toast } from 'sonner';
import { apiPost } from '../../../services/apiClient';
import { API_BASE_URL } from '../../../services/apiClient';
import '../../User/Product/CheckoutModal.css';
import './EventCheckoutModal.css';

const GooglePayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleLogoIcon = ({ color = '#000' }) => (
  <svg width="13" height="16" viewBox="0 0 814 1000" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164.2-39.5c-76.7 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 133.4-316.9 264.4-316.9 73.5 0 134.5 48.2 180.8 48.2 44.1 0 113.2-52.3 189.2-52.3 30.1 0 108.2 2.6 168.6 79.1zm-160.5-130c0-12.2.6-24.4-2.6-36.6-64.7 22.4-115.5 81.7-115.5 138.2 0 36.6 17.3 72.4 45.2 95.7 19.2 17.9 58.4 41.2 90.1 41.2 1.9 0 2.6 0 3.9-.6 0-87.6 0-171.8-21.1-238z"/>
  </svg>
);

const PaymentIcons = () => (
  <div className="co-summary-icons">
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      <span className="co-pay-badge" style={{ background: '#1a1f71', color: '#fff', border: '1px solid #1a1f71', fontStyle: 'italic', fontSize: '0.72rem' }}>VISA</span>
      <span className="co-pay-badge" style={{ background: '#fff', padding: '3px 7px', gap: 0 }}>
        <span style={{ color: '#eb001b', fontSize: '1.05rem', lineHeight: 1 }}>●</span>
        <span style={{ color: '#f79e1b', fontSize: '1.05rem', lineHeight: 1, marginLeft: -6 }}>●</span>
      </span>
      <span className="co-pay-badge" style={{ background: '#016fd0', color: '#fff', border: '1px solid #016fd0' }}>AMEX</span>
    </div>
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      <span className="co-pay-badge" style={{ background: '#fff', color: '#5f6368', gap: 5, paddingLeft: 8, paddingRight: 10, height: 28 }}>
        <GooglePayIcon />
        <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#5f6368' }}>Pay</span>
      </span>
      <span className="co-pay-badge" style={{ background: '#000', color: '#fff', gap: 5, paddingLeft: 9, paddingRight: 11, height: 28, border: '1px solid #000' }}>
        <AppleLogoIcon color="#fff" />
        <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>Pay</span>
      </span>
    </div>
  </div>
);

const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const EventCheckoutModal = ({ isOpen, onClose, event, onOrderPlaced }) => {
  const [contact, setContact] = useState({ email: '', firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', zip: '', phone: '' });
  const [card, setCard]       = useState({ number: '', expiry: '', cvv: '' });
  const [billingSame, setBillingSame] = useState(true);
  const [bill, setBill]       = useState({ firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', zip: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [quantity, setQuantity]         = useState(1);
  const [placing, setPlacing]           = useState(false);
  const [dateSpots, setDateSpots]       = useState(null); // { capacity, booked, remaining }

  // Fetch live spots for the selected date
  useEffect(() => {
    if (!event?.id || !selectedDate) { setDateSpots(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${event.id}/spots?date=${selectedDate}`);
        const data = await res.json();
        if (!cancelled) setDateSpots(data);
      } catch {
        if (!cancelled) setDateSpots(null);
      }
    })();
    return () => { cancelled = true; };
  }, [event?.id, selectedDate]);

  // Reset quantity when date changes
  useEffect(() => { setQuantity(1); }, [selectedDate]);

  const setC = (k, v) => setContact(p => ({ ...p, [k]: v }));
  const setK = (k, v) => setCard(p => ({ ...p, [k]: v }));
  const setB = (k, v) => setBill(p => ({ ...p, [k]: v }));

  const fmtCard   = v => { const d = v.replace(/\D/g,'').slice(0,16); return d.match(/.{1,4}/g)?.join(' ') || d; };
  const fmtExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };
  const fmtPhone  = v => { const d = v.replace(/\D/g,'').slice(0,10); if (d.length < 4) return d; if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`; return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`; };

  const todayISO   = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const minDateISO = event?.date > todayISO ? event.date : todayISO;
  const spotsRemaining = dateSpots ? dateSpots.remaining : (event?.spotsLeft ?? 10);
  const isSoldOut = dateSpots !== null && spotsRemaining <= 0;
  const maxQty     = Math.min(10, spotsRemaining);
  const unitPrice  = Number(event?.price || 0);
  const subtotal   = unitPrice * quantity;
  const total      = subtotal;

  const handlePlace = async () => {
    if (!selectedDate) { toast.error('Please select a visit date.'); return; }
    if (isSoldOut) { toast.error(`This event is sold out for ${fmtDate(selectedDate)}. Please select a different date.`); return; }
    if (!contact.email || !contact.firstName || !contact.lastName || !contact.address1 || !contact.city || !contact.state || !contact.zip) {
      toast.error('Please fill in all required contact fields.'); return;
    }
    if (!card.number || !card.expiry || !card.cvv) {
      toast.error('Please fill in your card details.'); return;
    }
    if (!billingSame && (!bill.firstName || !bill.lastName || !bill.address1 || !bill.city || !bill.state || !bill.zip)) {
      toast.error('Please fill in all required billing fields.'); return;
    }

    setPlacing(true);
    try {
      const cardLastFour = card.number.replace(/\D/g,'').slice(-4);
      await apiPost('/api/event-bookings', {
        eventId: event.id,
        bookingDate: selectedDate,
        quantity,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || null,
        addressLine1: contact.address1,
        addressLine2: contact.address2 || null,
        city: contact.city,
        stateProvince: contact.state,
        zipCode: contact.zip,
        billingSameAsContact: billingSame,
        billingFullName: billingSame ? null : `${bill.firstName} ${bill.lastName}`.trim(),
        billingAddress1: billingSame ? null : bill.address1,
        billingAddress2: billingSame ? null : bill.address2 || null,
        billingCity: billingSame ? null : bill.city,
        billingState: billingSame ? null : bill.state,
        billingZip: billingSame ? null : bill.zip,
        cardLastFour,
      });
      toast.success('Your booking is confirmed! Check your email for details.', { duration: 6000 });
      onOrderPlaced();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to place booking. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="co-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="co-modal eco-modal">
        {/* Header */}
        <div className="co-header">
          <div className="co-header-left">
            <Lock size={16} color="#2d6a4f" />
            <h1>EVENT CHECKOUT</h1>
          </div>
          <button className="co-close-btn" onClick={onClose}><X size={16} /> Close</button>
        </div>

        <div className="co-body">
          {/* ── LEFT: Form ── */}
          <div className="co-left">

            {/* 0. Visit Date + Quantity */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">1</div>
                <span className="co-section-title">Select Your Visit Date &amp; Guests</span>
              </div>

              <div className="co-field">
                <label>Visit Date <span style={{ color: '#ef4444' }}>*</span></label>
                <CheckoutDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Select your visit date"
                  minDate={minDateISO}
                  maxDate={event.endDate || event.date}
                />
                {event.date && (
                  <span className="eco-date-hint">
                    Event runs {fmtDate(event.date)}{event.endDate && event.endDate !== event.date ? ` – ${fmtDate(event.endDate)}` : ''}
                  </span>
                )}
              </div>

              <div className="co-field" style={{ maxWidth: 200 }}>
                <label>Number of Guests <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="eco-qty-row">
                  <button
                    className="eco-qty-btn"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    type="button"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="eco-qty-val">{quantity}</span>
                  <button
                    className="eco-qty-btn"
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    type="button"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="eco-qty-hint">
                    <Users size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {!selectedDate ? 'Select a date' : isSoldOut ? <span style={{ color: '#ef4444', fontWeight: 600 }}>Sold out for this date</span> : `${spotsRemaining} spots left`}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Contact Information */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">2</div>
                <span className="co-section-title">Contact Information</span>
              </div>

              <div className="co-row">
                <div className="co-field">
                  <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="John" value={contact.firstName} onChange={e => setC('firstName', e.target.value)} />
                </div>
                <div className="co-field">
                  <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="Doe" value={contact.lastName} onChange={e => setC('lastName', e.target.value)} />
                </div>
              </div>
              <div className="co-field">
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" placeholder="example.user@email.com" value={contact.email} onChange={e => setC('email', e.target.value)} />
              </div>
              <div className="co-field">
                <label>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="123 Forest Trail" value={contact.address1} onChange={e => setC('address1', e.target.value)} />
              </div>
              <div className="co-field">
                <label>Address Line 2 <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" placeholder="Apt, Suite, Unit..." value={contact.address2} onChange={e => setC('address2', e.target.value)} />
              </div>
              <div className="co-row">
                <div className="co-field" style={{ flex: 2 }}>
                  <label>City <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="City" value={contact.city} onChange={e => setC('city', e.target.value)} />
                </div>
                <div className="co-field" style={{ flex: 1.2 }}>
                  <label>State / Province <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="State" value={contact.state} onChange={e => setC('state', e.target.value)} />
                </div>
                <div className="co-field" style={{ flex: 1 }}>
                  <label>ZIP Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="00000" value={contact.zip} onChange={e => setC('zip', e.target.value)} />
                </div>
              </div>
              <div className="co-field" style={{ maxWidth: '50%' }}>
                <label>Phone Number <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" placeholder="(555) 123-4567" value={contact.phone} onChange={e => setC('phone', fmtPhone(e.target.value))} />
              </div>
            </div>

            {/* 3. Payment */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">3</div>
                <span className="co-section-title">Payment</span>
              </div>
              <div className="co-field">
                <label>Card Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="1234 5678 9012 3456"
                  value={card.number} onChange={e => setK('number', fmtCard(e.target.value))}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />
              </div>
              <div className="co-row">
                <div className="co-field">
                  <label>Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="MM/YY"
                    value={card.expiry} onChange={e => setK('expiry', fmtExpiry(e.target.value))}
                    style={{ fontFamily: 'monospace' }} />
                </div>
                <div className="co-field">
                  <label>CVV <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="123" maxLength={4}
                    value={card.cvv} onChange={e => setK('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                    style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
            </div>

            {/* 4. Billing */}
            <div className="co-section" style={{ marginBottom: 0 }}>
              <div className="co-section-header">
                <div className="co-step-num">4</div>
                <span className="co-section-title">Billing</span>
              </div>
              <label className="co-billing-check">
                <input type="checkbox" checked={billingSame} onChange={e => setBillingSame(e.target.checked)} />
                <span>Same as Contact Information</span>
              </label>
              {!billingSame && (
                <div style={{ marginTop: 18 }}>
                  <div className="co-row">
                    <div className="co-field">
                      <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="John" value={bill.firstName} onChange={e => setB('firstName', e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="Doe" value={bill.lastName} onChange={e => setB('lastName', e.target.value)} />
                    </div>
                  </div>
                  <div className="co-field">
                    <label>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" placeholder="123 Forest Trail" value={bill.address1} onChange={e => setB('address1', e.target.value)} />
                  </div>
                  <div className="co-field">
                    <label>Address Line 2 <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                    <input type="text" placeholder="Apt, Suite, Unit..." value={bill.address2} onChange={e => setB('address2', e.target.value)} />
                  </div>
                  <div className="co-row">
                    <div className="co-field" style={{ flex: 2 }}>
                      <label>City <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="City" value={bill.city} onChange={e => setB('city', e.target.value)} />
                    </div>
                    <div className="co-field" style={{ flex: 1.2 }}>
                      <label>State / Province <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="State" value={bill.state} onChange={e => setB('state', e.target.value)} />
                    </div>
                    <div className="co-field" style={{ flex: 1 }}>
                      <label>ZIP Code <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="00000" value={bill.zip} onChange={e => setB('zip', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="co-right">
            <p className="co-summary-title">Order Summary</p>

            {/* Event info banner */}
            <div className="eco-event-banner">
              <p className="eco-event-name">{event.title || event.name}</p>
              {event.category && <span className="eco-event-cat">{event.category}</span>}
              {event.location && (
                <p className="eco-event-loc">📍 {event.location}</p>
              )}
              {event.time && (
                <p className="eco-event-loc">🕐 {event.time}</p>
              )}
            </div>

            {/* Selected date */}
            <div className="tco-info-row" style={{ marginTop: 14 }}>
              <span className="tco-info-label">Visit Date</span>
              <span className="tco-info-value">{selectedDate ? fmtDate(selectedDate) : <span style={{ color: '#aaa', fontWeight: 400, fontSize: '0.82rem' }}>Not selected yet</span>}</span>
            </div>

            {/* Quantity + pricing */}
            <div className="co-item-list" style={{ marginTop: 14 }}>
              <div className="tco-qty-row">
                <span>{quantity} × guest{quantity !== 1 ? 's' : ''}</span>
                <span>${unitPrice.toFixed(2)} each</span>
              </div>
            </div>

            {/* Totals */}
            <div className="co-totals">
              <div className="co-totals-row">
                <span className="co-totals-label">Subtotal</span>
                <span className="co-totals-value">${subtotal.toFixed(2)}</span>
              </div>
              <div className="co-totals-row total">
                <span className="co-totals-label">TOTAL</span>
                <span className="co-totals-value">${total.toFixed(2)}</span>
              </div>
            </div>

            {isSoldOut && selectedDate && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>⚠️ Sold out for {fmtDate(selectedDate)}</p>
                <p style={{ color: '#999', fontSize: '0.78rem', margin: '4px 0 0' }}>Try selecting a different date above.</p>
              </div>
            )}
            <button className="co-place-btn" onClick={handlePlace} disabled={placing || isSoldOut}>
              {placing ? 'PLACING BOOKING...' : 'CONFIRM BOOKING'}
            </button>
            <p className="co-secure-note">Transactions are secure and encrypted</p>
            <PaymentIcons />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCheckoutModal;
