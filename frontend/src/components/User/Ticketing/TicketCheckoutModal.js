import { useState } from 'react';
import { Lock, X, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../services/apiClient';
import '../../User/Product/CheckoutModal.css';
import './TicketCheckoutModal.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TicketCheckoutModal = ({
  isOpen, onClose,
  visitDate,       // { month, day, year }
  ticketType,      // { id, name, prices }
  quantities,      // { adult, child, senior }
  addOns,          // [{ id, name, price }]
  subtotal, total,
  onOrderPlaced,
}) => {
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [billing, setBilling] = useState({ address1: '', address2: '', city: '', state: '', zip: '' });
  const [placing, setPlacing] = useState(false);

  const setF = (setter, key, val) => setter(p => ({ ...p, [key]: val }));

  const fmtCard = v => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.match(/.{1,4}/g)?.join(' ') || d;
  };
  const fmtExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const visitDateStr = visitDate
    ? `${MONTHS[visitDate.month]} ${visitDate.day}, ${visitDate.year}`
    : '';

  const totalGuests = (quantities?.adult || 0) + (quantities?.child || 0) + (quantities?.senior || 0);

  const handlePlace = async () => {
    if (!contact.fullName || !contact.email) {
      toast.error('Please enter your name and email.');
      return;
    }
    if (!card.number || !card.expiry || !card.cvv) {
      toast.error('Please fill in your card details.');
      return;
    }
    if (!billing.address1 || !billing.city || !billing.state || !billing.zip) {
      toast.error('Please fill in your billing address.');
      return;
    }

    setPlacing(true);
    try {
      const cardLastFour = card.number.replace(/\D/g, '').slice(-4);
      const billingAddress = `${billing.address1}${billing.address2 ? ', ' + billing.address2 : ''}, ${billing.city}, ${billing.state} ${billing.zip}`;

      // ISO date string for the visit date
      const visitDateISO = visitDate
        ? `${visitDate.year}-${String(visitDate.month + 1).padStart(2, '0')}-${String(visitDate.day).padStart(2, '0')}`
        : null;

      const response = await fetch(`${API_BASE_URL}/api/ticket-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone || null,
          visitDate: visitDateISO,
          ticketType: ticketType?.name,
          adultQty: quantities?.adult || 0,
          childQty: quantities?.child || 0,
          seniorQty: quantities?.senior || 0,
          addOns: addOns || [],
          billingAddress,
          cardLastFour,
          subtotal,
          total,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to place order.');
      }

      toast.success('Your tickets have been booked! 🎉 Check your email for confirmation.', { duration: 6000 });
      onOrderPlaced();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="co-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="co-modal tco-modal">
        {/* Header */}
        <div className="co-header">
          <div className="co-header-left">
            <Lock size={16} color="#2d6a4f" />
            <h1>TICKET CHECKOUT</h1>
          </div>
          <button className="co-close-btn" onClick={onClose}><X size={16} /> Close</button>
        </div>

        <div className="co-body">
          {/* ── LEFT: Form ── */}
          <div className="co-left">

            {/* 1. Contact Info */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">1</div>
                <span className="co-section-title">Contact Information</span>
              </div>
              <div className="co-row">
                <div className="co-field">
                  <label>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="John Doe" value={contact.fullName}
                    onChange={e => setF(setContact, 'fullName', e.target.value)} />
                </div>
                <div className="co-field">
                  <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="email" placeholder="john@example.com" value={contact.email}
                    onChange={e => setF(setContact, 'email', e.target.value)} />
                </div>
              </div>
              <div className="co-field" style={{ maxWidth: '50%' }}>
                <label>Phone <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" placeholder="(555) 000-0000" value={contact.phone}
                  onChange={e => setF(setContact, 'phone', e.target.value)} />
              </div>
            </div>

            {/* 2. Payment */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">2</div>
                <span className="co-section-title">Payment</span>
              </div>
              <div className="co-field">
                <label>Card Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="1234 5678 9012 3456"
                  value={card.number} onChange={e => setCard(p => ({ ...p, number: fmtCard(e.target.value) }))}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />
              </div>
              <div className="co-row">
                <div className="co-field">
                  <label>Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="MM/YY"
                    value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: fmtExpiry(e.target.value) }))}
                    style={{ fontFamily: 'monospace' }} />
                </div>
                <div className="co-field">
                  <label>CVV <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="123" maxLength={4}
                    value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
            </div>

            {/* 3. Billing Address */}
            <div className="co-section" style={{ marginBottom: 0 }}>
              <div className="co-section-header">
                <div className="co-step-num">3</div>
                <span className="co-section-title">Billing Address</span>
              </div>
              <div className="co-field">
                <label>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="123 Forest Trail" value={billing.address1}
                  onChange={e => setF(setBilling, 'address1', e.target.value)} />
              </div>
              <div className="co-field">
                <label>Address Line 2 <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" placeholder="Apt, Suite, Unit..." value={billing.address2}
                  onChange={e => setF(setBilling, 'address2', e.target.value)} />
              </div>
              <div className="co-row">
                <div className="co-field" style={{ flex: 2 }}>
                  <label>City <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="City" value={billing.city}
                    onChange={e => setF(setBilling, 'city', e.target.value)} />
                </div>
                <div className="co-field" style={{ flex: 1.2 }}>
                  <label>State <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="State" value={billing.state}
                    onChange={e => setF(setBilling, 'state', e.target.value)} />
                </div>
                <div className="co-field" style={{ flex: 1 }}>
                  <label>ZIP Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="00000" value={billing.zip}
                    onChange={e => setF(setBilling, 'zip', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="co-right">
            <p className="co-summary-title">Order Summary</p>

            {/* Visit Date */}
            <div className="tco-info-row">
              <span className="tco-info-label">Visit Date</span>
              <span className="tco-info-value">{visitDateStr}</span>
            </div>

            {/* Ticket type + quantities */}
            <div className="co-item-list" style={{ marginTop: 14 }}>
              <div className="tco-ticket-type">
                <Ticket size={14} style={{ color: '#2d6a4f', flexShrink: 0, marginTop: 2 }} />
                <span className="tco-ticket-name">{ticketType?.name}</span>
              </div>
              {(quantities?.adult || 0) > 0 && (
                <div className="tco-qty-row">
                  <span>{quantities.adult}x Adult</span>
                  <span>${(quantities.adult * ticketType.prices.adult).toFixed(2)}</span>
                </div>
              )}
              {(quantities?.child || 0) > 0 && (
                <div className="tco-qty-row">
                  <span>{quantities.child}x Child</span>
                  <span>${(quantities.child * ticketType.prices.child).toFixed(2)}</span>
                </div>
              )}
              {(quantities?.senior || 0) > 0 && (
                <div className="tco-qty-row">
                  <span>{quantities.senior}x Senior</span>
                  <span>${(quantities.senior * ticketType.prices.senior).toFixed(2)}</span>
                </div>
              )}

              {addOns && addOns.length > 0 && (
                <>
                  <div className="tco-divider" />
                  <p className="tco-addon-header">Add-ons</p>
                  {addOns.map(a => (
                    <div key={a.id} className="tco-qty-row">
                      <span>{a.name} x{totalGuests}</span>
                      <span>${(a.price * totalGuests).toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}
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

            <button className="co-place-btn" onClick={handlePlace} disabled={placing}>
              {placing ? 'BOOKING...' : 'CONFIRM & PAY'}
            </button>
            <p className="co-secure-note">Tickets delivered to your email instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCheckoutModal;
