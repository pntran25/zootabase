import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../services/firebase';
import { apiGet } from '../../../services/apiClient';
import {
  Calendar, ChevronRight, CreditCard, LogOut, Mail,
  Package, Shield, Ticket, User, Bell, Star,
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const NAV_ITEMS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'orders', label: 'Order History', icon: Package },
  { id: 'membership', label: 'Membership', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [shopOrders, setShopOrders] = useState([]);
  const [ticketOrders, setTicketOrders] = useState([]);
  const [membership, setMembership] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] = useState(true);

  // Notification preferences (local state only — no backend persistence)
  const [notifPrefs, setNotifPrefs] = useState({
    email_promotions: true,
    email_orders: true,
    email_events: false,
    email_membership: true,
  });

  useEffect(() => {
    if (!currentUser) return;
    apiGet('/api/profile/orders')
      .then(data => { setShopOrders(data.shopOrders || []); setTicketOrders(data.ticketOrders || []); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
    apiGet('/api/profile/membership')
      .then(data => setMembership(data.membership))
      .catch(() => {})
      .finally(() => setMembershipLoading(false));
  }, [currentUser]);

  const displayName = userProfile?.FullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const email = userProfile?.Email || currentUser?.email || '';
  const memberSince = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLogout = async () => {
    try { await auth.signOut(); navigate('/'); } catch {}
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const toggleNotif = (key) => setNotifPrefs(p => ({ ...p, [key]: !p[key] }));

  /* ────────────────── SECTION RENDERERS ────────────────── */

  const renderAccount = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground m-0">Account Information</h2>
        <p className="text-sm text-muted-foreground mt-1 m-0">Your personal details</p>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground m-0">Full Name</p>
            <p className="font-medium text-foreground m-0 mt-0.5">{displayName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground m-0">Email Address</p>
            <p className="font-medium text-foreground m-0 mt-0.5">{email}</p>
          </div>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>
        {memberSince && (
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground m-0">Member Since</p>
              <p className="font-medium text-foreground m-0 mt-0.5">{memberSince}</p>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer border-none"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground m-0">Order History</h2>
        <p className="text-sm text-muted-foreground mt-1 m-0">All your past ticket and gift shop purchases</p>
      </div>

      {ordersLoading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Loading orders...</p>
      ) : (ticketOrders.length === 0 && shopOrders.length === 0) ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground m-0 text-sm">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Ticket orders */}
          {ticketOrders.map((order) => (
            <div key={`t-${order.TicketOrderID}`} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Ticket</span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground m-0 text-sm">{order.TicketType}</p>
                  <p className="text-xs text-muted-foreground m-0 mt-1">
                    Visit: {fmtDate(order.VisitDate)} &middot; {[
                      order.AdultQty > 0 && `${order.AdultQty} Adult`,
                      order.ChildQty > 0 && `${order.ChildQty} Child`,
                      order.SeniorQty > 0 && `${order.SeniorQty} Senior`,
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="font-semibold text-foreground text-sm">${Number(order.Total).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2 m-0">Ordered {fmtDate(order.PlacedAt)}</p>
            </div>
          ))}

          {/* Shop orders */}
          {shopOrders.map((order) => (
            <div key={`s-${order.OrderID}`} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Gift Shop</span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground m-0 text-sm">Order #{order.OrderID}</p>
                  {order.items.length > 0 && (
                    <p className="text-xs text-muted-foreground m-0 mt-1">
                      {order.items.map(i => i.name).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-foreground text-sm">${Number(order.Total).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2 m-0">Ordered {fmtDate(order.PlacedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMembership = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground m-0">Membership</h2>
        <p className="text-sm text-muted-foreground mt-1 m-0">Your zoo membership status</p>
      </div>

      {membershipLoading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Loading...</p>
      ) : membership ? (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-foreground">{membership.PlanName}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground m-0">Billing</p>
              <p className="font-medium text-foreground m-0 mt-0.5">{membership.BillingPeriod || 'Monthly'}</p>
            </div>
            <div>
              <p className="text-muted-foreground m-0">Price</p>
              <p className="font-medium text-foreground m-0 mt-0.5">${Number(membership.Total).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground m-0">Start Date</p>
              <p className="font-medium text-foreground m-0 mt-0.5">{fmtDate(membership.StartDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground m-0">Expires</p>
              <p className="font-medium text-foreground m-0 mt-0.5">{fmtDate(membership.EndDate)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Star className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground m-0 text-sm">No active membership</p>
          <button
            onClick={() => navigate('/membership')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer border-none"
          >
            View Plans
          </button>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground m-0">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1 m-0">Choose what emails you'd like to receive</p>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {[
          { key: 'email_orders', label: 'Order Confirmations', desc: 'Receipts and booking confirmations' },
          { key: 'email_events', label: 'Event Updates', desc: 'New events and schedule changes' },
          { key: 'email_promotions', label: 'Promotions & Offers', desc: 'Discounts, seasonal deals, and special offers' },
          { key: 'email_membership', label: 'Membership Reminders', desc: 'Renewal reminders and member perks' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-foreground m-0 text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground m-0 mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggleNotif(item.key)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none",
                notifPrefs[item.key] ? "bg-primary" : "bg-muted"
              )}
              role="switch"
              aria-checked={notifPrefs[item.key]}
            >
              <span className={cn(
                "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                notifPrefs[item.key] ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground m-0">Security</h2>
        <p className="text-sm text-muted-foreground mt-1 m-0">Manage your account security</p>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium text-foreground m-0 text-sm">Password</p>
            <p className="text-xs text-muted-foreground m-0 mt-0.5">
              {currentUser?.providerData?.[0]?.providerId === 'password'
                ? 'Last changed: Unknown'
                : `Signed in via ${currentUser?.providerData?.[0]?.providerId || 'third-party'}`
              }
            </p>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium text-foreground m-0 text-sm">Login Provider</p>
            <p className="text-xs text-muted-foreground m-0 mt-0.5 capitalize">
              {currentUser?.providerData?.[0]?.providerId === 'password' ? 'Email & Password' : (currentUser?.providerData?.[0]?.providerId || 'Unknown')}
            </p>
          </div>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer border-none"
        >
          <LogOut className="h-4 w-4" />
          Sign Out of All Devices
        </button>
      </div>
    </div>
  );

  const SECTIONS = {
    account: renderAccount,
    orders: renderOrders,
    membership: renderMembership,
    notifications: renderNotifications,
    security: renderSecurity,
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '4rem' }}>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        {/* Profile header card */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground m-0 truncate">{displayName}</h1>
            <p className="text-sm text-muted-foreground m-0 mt-0.5 truncate">{email}</p>
          </div>
        </div>

        {/* Two-column layout: sidebar + content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <nav className="md:w-56 shrink-0">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-none text-left",
                      activeSection === item.id
                        ? "bg-primary/10 text-primary"
                        : "bg-transparent text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 transition-opacity", activeSection === item.id ? "opacity-100" : "opacity-0")} />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {SECTIONS[activeSection]()}
          </div>
        </div>
      </div>
      <div className="h-12" />
    </div>
  );
};

export default ProfilePage;
