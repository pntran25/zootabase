import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import MembershipCheckoutModal from './MembershipCheckoutModal';
import MembershipLoginModal from './MembershipLoginModal';
import heroImg from '../../../assets/images/BreakfastWithGiraffes.png';
import './MembershipPage.css';

// ── Feature check/dash icons ──────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const DashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Benefit card icons (SVG, matching reference) ──────────────────────────────
const TicketSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
  </svg>
);
const PercentSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const CalendarSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const GiftSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const HeartSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CoffeeSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);

// ── Plan icons by sort order ──────────────────────────────────────────────────
const PlanIcon = ({ sortOrder }) => {
  if (sortOrder === 1) return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
  if (sortOrder === 2) return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    </svg>
  );
};

const ICON_COLORS = {
  1: { bg: '#dbeafe', color: '#2563eb' },
  2: { bg: '#dcfce7', color: '#16a34a' },
  3: { bg: '#ffedd5', color: '#ea580c' },
};

// ── Static benefit list ───────────────────────────────────────────────────────
const BENEFITS = [
  { Icon: TicketSvg,  title: 'Unlimited Visits',      desc: 'Come as often as you like, all year round' },
  { Icon: PercentSvg, title: 'Exclusive Discounts',   desc: 'Save on dining, shopping, and special events' },
  { Icon: CalendarSvg,title: 'Early Access',           desc: 'Be first to book events, camps, and experiences' },
  { Icon: GiftSvg,    title: 'Member Perks',          desc: 'Guest passes, free parking, and surprise gifts' },
  { Icon: HeartSvg,   title: 'Support Conservation',  desc: 'Your membership helps protect endangered species' },
  { Icon: CoffeeSvg,  title: 'VIP Treatment',         desc: 'Skip the lines and enjoy member-only lounges' },
];

// ── Main Component ────────────────────────────────────────────────────────────
const MembershipPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const plansRef = useRef(null);
  const benefitsRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('yearly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    apiGet('/api/membership-plans')
      .then(data => { setPlans(data); setPlansLoading(false); })
      .catch(() => setPlansLoading(false));
  }, []);


  const handleContinue = useCallback(() => {
    if (!currentUser) {
      setLoginModalOpen(true);
      return;
    }
    setCheckoutOpen(true);
  }, [currentUser]);

  const priceForPlan = (plan) =>
    billingPeriod === 'yearly' ? plan.YearlyPrice : plan.MonthlyPrice;

  const priceLabel = (plan) => {
    const p = priceForPlan(plan);
    return billingPeriod === 'yearly'
      ? `$${Number(p).toFixed(0)}/yr`
      : `$${Number(p).toFixed(2)}/mo`;
  };

  return (
    <div className="mem-page">
      {/* ── Hero ── */}
      <section className="mem-hero">
        <img src={heroImg} alt="Membership hero" className="mem-hero-img" />
        <div className="mem-hero-overlay" />
        <div className="mem-hero-fade-bottom" />
        <div className="mem-hero-content">
          <span className="mem-hero-badge">✦ Join 50,000+ Members</span>
          <h1 className="mem-hero-heading">
            Become a Member,<br />
            <span className="mem-hero-green">Unlock the Wild</span>
          </h1>
          <p className="mem-hero-desc">
            Unlimited visits, exclusive perks, and unforgettable experiences. Your membership
            supports wildlife conservation and gives you year-round access to adventure.
          </p>
          <div className="mem-hero-btns">
            <button
              className="mem-btn-primary"
              onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Plans →
            </button>
            <button className="mem-btn-secondary" onClick={() => navigate('/ticketing')}>
              Day Pass Instead
            </button>
          </div>
        </div>
      </section>

      {/* ── Why Become a Member ── */}
      <div className="mem-benefits-wrapper" ref={benefitsRef}>
        <section className="mem-benefits">
          <h2 className="mem-section-title">Why Become a Member?</h2>
          <p className="mem-section-sub">More than just admission — membership opens the door to a world of exclusive benefits</p>
          <div className="mem-benefits-grid">
            {BENEFITS.map(({ Icon, title, desc }) => (
              <div key={title} className="mem-benefit-card">
                <div className="mem-benefit-icon">
                  <Icon />
                </div>
                <h3 className="mem-benefit-title">{title}</h3>
                <p className="mem-benefit-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Choose Your Membership ── */}
      <div className="mem-plans-wrapper">
        <section className="mem-plans-section" ref={plansRef}>
          <h2 className="mem-section-title">Choose Your Membership</h2>
          <p className="mem-section-sub">Select the plan that fits your adventure style</p>

          {/* Sliding billing toggle */}
          <div className="mem-billing-toggle">
            <div className={`mem-toggle-indicator${billingPeriod === 'yearly' ? ' right' : ''}`} />
            <button
              className={`mem-toggle-btn${billingPeriod === 'monthly' ? ' active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`mem-toggle-btn${billingPeriod === 'yearly' ? ' active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly <span className="mem-save-badge">Save 20%</span>
            </button>
          </div>

          {plansLoading ? (
            <p className="mem-loading">Loading plans...</p>
          ) : (
            <div className="mem-plans-grid">
              {plans.map(plan => {
                const iconStyle = ICON_COLORS[plan.SortOrder] || ICON_COLORS[1];
                const isSelected = selectedPlan?.PlanID === plan.PlanID;
                return (
                  <div
                    key={plan.PlanID}
                    className={`mem-plan-card${plan.IsPopular ? ' popular' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedPlan(isSelected ? null : plan)}
                  >
                    {plan.IsPopular && <div className="mem-popular-badge">Most Popular</div>}
                    <div className="mem-plan-icon" style={{ background: iconStyle.bg, color: iconStyle.color }}>
                      <PlanIcon sortOrder={plan.SortOrder} />
                    </div>
                    <h3 className="mem-plan-name">{plan.Name}</h3>
                    <p className="mem-plan-desc">{plan.Description}</p>
                    <div className="mem-plan-price">{priceLabel(plan)}</div>
                    <button
                      className={`mem-select-btn${isSelected ? ' selected' : ''}`}
                      onClick={e => { e.stopPropagation(); setSelectedPlan(isSelected ? null : plan); }}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </button>
                    <ul className="mem-features-list">
                      {(plan.Features || []).map((f, i) => (
                        <li key={i} className={`mem-feature${f.included ? '' : ' excluded'}`}>
                          <span className={`mem-feature-icon${f.included ? '' : ' dash'}`}>
                            {f.included ? <CheckIcon /> : <DashIcon />}
                          </span>
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── FAQ ── */}
      <div className="mem-faq-wrapper">
        <section className="mem-faq-section">
          <h2 className="mem-section-title">Frequently Asked Questions</h2>
          <div className="mem-faq-list">
            {[
              { q: 'Can I upgrade my membership later?', a: "Yes! You can upgrade at any time. We'll prorate the difference for the remaining months of your membership." },
              { q: 'Are memberships transferable?', a: 'Family and Premium memberships are tied to your household. Guest passes can be used by anyone you bring along.' },
              { q: 'What if I move away?', a: 'We offer prorated refunds for relocations more than 50 miles away with proof of address change.' },
              { q: 'Do memberships include special events?', a: 'Members get early access and discounted tickets to special events. Some Premium member events are complimentary.' },
            ].map(({ q, a }) => (
              <div key={q} className="mem-faq-card">
                <p className="mem-faq-q">{q}</p>
                <p className="mem-faq-a">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── CTA Banner ── */}
      <div className="mem-cta-wrapper">
        <section className="mem-cta-section">
          <h2 className="mem-cta-heading">Ready to Join the Wildwood Family?</h2>
          <p className="mem-cta-sub">
            Start your membership today and enjoy unlimited access to all the wonder and adventure Wildwood Zoo has to offer.
          </p>
          <div className="mem-cta-btns">
            <button
              className="mem-cta-btn-primary"
              onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started →
            </button>
            <button
              className="mem-cta-btn-outline"
              onClick={() => benefitsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </button>
          </div>
        </section>
      </div>

      {/* ── Sticky Continue Bar ── */}
      {selectedPlan && (
        <div className="mem-sticky-bar">
          <span className="mem-sticky-info">
            {selectedPlan.Name} · {billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'} — <strong>${Number(priceForPlan(selectedPlan)).toFixed(billingPeriod === 'yearly' ? 0 : 2)}</strong>
          </span>
          <button className="mem-continue-btn" onClick={handleContinue}>
            Continue with {selectedPlan.Name} →
          </button>
        </div>
      )}

      {/* ── Login Modal ── */}
      <MembershipLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        planName={selectedPlan?.Name || 'selected'}
        onSuccess={() => {
          setLoginModalOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* ── Checkout Modal ── */}
      {checkoutOpen && selectedPlan && (
        <MembershipCheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          plan={selectedPlan}
          billingPeriod={billingPeriod}
          total={priceForPlan(selectedPlan)}
          userProfile={userProfile}
          onOrderPlaced={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default MembershipPage;
