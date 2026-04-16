import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import './CheckoutModal.css';

const SHIPPING_COST = 6.99;
const TAX_RATE = 0.085;

const EMOJI_MAP = {
  'Plush Toys & Stuffed Animals': '🧸',
  'Apparel & Wearables': '👕',
  'Souvenirs & Memorabilia': '🏆',
  'Books & Educational Items': '📚',
  'Toys & Games': '🎮',
  'Home & Decor': '🏠',
  'Jewelry & Accessories': '💎',
  'Art & Collectibles': '🎨',
};

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

const PaymentIcons = ({ size = 'sm' }) => (
  <div className={size === 'sm' ? 'co-summary-icons' : 'co-payment-icons'} style={{ flexDirection: 'column', alignItems: size === 'sm' ? 'center' : 'flex-start' }}>
    {/* Row 1: Visa, Mastercard, Amex */}
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      <span className="co-pay-badge" style={{ background: '#1a1f71', color: '#fff', border: '1px solid #1a1f71', fontStyle: 'italic', fontSize: '0.72rem' }}>VISA</span>
      <span className="co-pay-badge" style={{ background: '#fff', padding: '3px 7px', gap: 0 }}>
        <span style={{ color: '#eb001b', fontSize: '1.05rem', lineHeight: 1 }}>●</span>
        <span style={{ color: '#f79e1b', fontSize: '1.05rem', lineHeight: 1, marginLeft: -6 }}>●</span>
      </span>
      <span className="co-pay-badge" style={{ background: '#016fd0', color: '#fff', border: '1px solid #016fd0' }}>AMEX</span>
    </div>
    {/* Row 2: Google Pay, Apple Pay */}
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

const CheckoutModal = ({ isOpen, onClose, cart, cartTotal, membershipDiscount = 0, onOrderPlaced }) => {
  const { currentUser } = useAuth();
  const [ship, setShip] = useState({ email: currentUser?.email || '', firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', zip: '', phone: '' });
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [billingSame, setBillingSame] = useState(true);
  const [bill, setBill] = useState({ firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', zip: '' });
  const setB = (key, val) => setBill(p => ({ ...p, [key]: val }));
  const [placing, setPlacing] = useState(false);

  const subtotal = cartTotal;
  const discountAmount = membershipDiscount > 0 ? +(subtotal * membershipDiscount / 100).toFixed(2) : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + SHIPPING_COST + tax;

  const setS = (key, val) => setShip(p => ({ ...p, [key]: val }));
  const setC = (key, val) => setCard(p => ({ ...p, [key]: val }));

  const fmtCard = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.match(/.{1,4}/g)?.join(' ') || d;
  };
  const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const fmtPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const handlePlace = async () => {
    if (!ship.email || !ship.firstName || !ship.lastName || !ship.address1 || !ship.city || !ship.state || !ship.zip) {
      toast.error('Please fill in all required shipping fields.');
      return;
    }
    if (!card.number || !card.expiry || !card.cvv) {
      toast.error('Please fill in your card details.');
      return;
    }
    if (!billingSame && (!bill.firstName || !bill.lastName || !bill.address1 || !bill.city || !bill.state || !bill.zip)) {
      toast.error('Please fill in all required billing fields.');
      return;
    }
    setPlacing(true);
    try {
      const cardLastFour = card.number.replace(/\D/g, '').slice(-4);
      const orderItems = JSON.stringify(
        cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
      );
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: ship.firstName, lastName: ship.lastName, email: ship.email, phone: ship.phone,
          addressLine1: ship.address1, addressLine2: ship.address2,
          city: ship.city, stateProvince: ship.state, zipCode: ship.zip,
          billingSameAsShipping: billingSame,
          billingFullName: billingSame ? null : `${bill.firstName} ${bill.lastName}`.trim(),
          billingAddress1: billingSame ? null : bill.address1,
          billingAddress2: billingSame ? null : bill.address2,
          billingCity: billingSame ? null : bill.city,
          billingState: billingSame ? null : bill.state,
          billingZip: billingSame ? null : bill.zip,
          cardLastFour,
          subtotal: discountedSubtotal,
          membershipDiscount, discountAmount,
          shipping: SHIPPING_COST, tax, total, orderItems,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to place order.');
      }
      toast.success('Your order has been successfully placed! 🎉', { duration: 5000 });
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
      <div className="co-modal">
        {/* Header */}
        <div className="co-header">
          <div className="co-header-left">
            <Lock size={16} color="#2d6a4f" />
            <h1>CHECKOUT</h1>
          </div>
          <button className="co-close-btn" onClick={onClose}><X size={16} /> Close</button>
        </div>

        <div className="co-body">
          {/* ── LEFT: Form ── */}
          <div className="co-left">

            {/* 1. Shipping Address */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">1</div>
                <span className="co-section-title">Shipping Address</span>
              </div>

              <div className="co-row">
                <div className="co-field">
                  <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="John" value={ship.firstName} onChange={e => setS('firstName', e.target.value)} />
                </div>
                <div className="co-field">
                  <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="Doe" value={ship.lastName} onChange={e => setS('lastName', e.target.value)} />
                </div>
              </div>
              <div className="co-field">
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" placeholder="example.user@email.com" value={ship.email} onChange={e => setS('email', e.target.value)} />
              </div>

              <div className="co-field">
                <label>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="123 Forest Trail" value={ship.address1} onChange={e => setS('address1', e.target.value)} />
              </div>

              <div className="co-field">
                <label>Address Line 2 <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" placeholder="Apt, Suite, Unit..." value={ship.address2} onChange={e => setS('address2', e.target.value)} />
              </div>

              <div className="co-row">
                <div className="co-field" style={{ flex: 2 }}>
                  <label>City <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="City" value={ship.city} onChange={e => setS('city', e.target.value)} />
                </div>
                <div className="co-field" style={{ flex: 1.2 }}>
                  <label>State / Province <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="State" value={ship.state} onChange={e => setS('state', e.target.value)} />
                </div>
                <div className="co-field" style={{ flex: 1 }}>
                  <label>ZIP Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" placeholder="00000" maxLength={5} value={ship.zip} onChange={e => setS('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} />
                </div>
              </div>

              <div className="co-field" style={{ maxWidth: '50%' }}>
                <label>Phone Number <span style={{ color: '#999', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" placeholder="(555) 123-4567" value={ship.phone} onChange={e => setS('phone', fmtPhone(e.target.value))} />
              </div>
            </div>

            <div className="co-section-divider" />

            {/* 2. Payment */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-step-num">2</div>
                <span className="co-section-title">Payment</span>
              </div>

              <div className="co-field">
                <label>Card Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={e => setC('number', fmtCard(e.target.value))}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
              </div>
              <div className="co-row">
                <div className="co-field">
                  <label>Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={e => setC('expiry', fmtExpiry(e.target.value))}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div className="co-field">
                  <label>CVV <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    value={card.cvv}
                    onChange={e => setC('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            <div className="co-section-divider" />

            {/* 3. Billing */}
            <div className="co-section" style={{ marginBottom: 0 }}>
              <div className="co-section-header">
                <div className="co-step-num">3</div>
                <span className="co-section-title">Billing</span>
              </div>
              <label className="co-billing-check">
                <input type="checkbox" checked={billingSame} onChange={e => setBillingSame(e.target.checked)} />
                <span>Same as Shipping</span>
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
                      <input type="text" placeholder="00000" maxLength={5} value={bill.zip} onChange={e => setB('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="co-right">
            <p className="co-summary-title">Order Summary</p>

            <div className="co-item-list">
              {cart.map(item => {
                const emoji = EMOJI_MAP[item.category] || '🎁';
                return (
                  <div key={item.id} className="co-item">
                    <div className="co-item-img">
                      {item.image && !item.image.includes('undefined')
                        ? <img src={item.image} alt={item.name} />
                        : emoji}
                    </div>
                    <div className="co-item-info">
                      <p className="co-item-name">{item.name}</p>
                      <p className="co-item-qty">Qty {item.quantity}</p>
                    </div>
                    <span className="co-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {membershipDiscount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>🎟 Member Discount — {membershipDiscount}% off applied</span>
              </div>
            )}

            <div className="co-totals">
              <div className="co-totals-row">
                <span className="co-totals-label">Subtotal</span>
                <span className="co-totals-value">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="co-totals-row">
                  <span className="co-totals-label" style={{ color: '#16a34a' }}>Member Discount ({membershipDiscount}%)</span>
                  <span className="co-totals-value" style={{ color: '#16a34a' }}>−${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="co-totals-row">
                <span className="co-totals-label">Shipping</span>
                <span className="co-totals-value">${SHIPPING_COST.toFixed(2)}</span>
              </div>
              <div className="co-totals-row">
                <span className="co-totals-label">Estimated Tax</span>
                <span className="co-totals-value">${tax.toFixed(2)}</span>
              </div>
              <div className="co-totals-row total">
                <span className="co-totals-label">TOTAL</span>
                <span className="co-totals-value">${total.toFixed(2)}</span>
              </div>
            </div>

            <button className="co-place-btn" onClick={handlePlace} disabled={placing}>
              {placing ? 'PLACING ORDER...' : 'PLACE ORDER'}
            </button>
            <p className="co-secure-note">Transactions are secure and encrypted</p>

            <PaymentIcons size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
