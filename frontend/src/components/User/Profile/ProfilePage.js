import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../services/firebase';
import { apiGet, apiPost } from '../../../services/apiClient';
import {
  Calendar, ChevronRight, CreditCard, LogOut, Mail,
  Package, Ticket, User, Star, Eye, QrCode,
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const NAV_ITEMS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'orders', label: 'Order History', icon: Package },
  { id: 'membership', label: 'Membership', icon: Star },
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
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => alert(`Receipt for Ticket Order #${order.TicketOrderID}\n\nType: ${order.TicketType}\nVisit Date: ${fmtDate(order.VisitDate)}\nAdult: ${order.AdultQty || 0}  Child: ${order.ChildQty || 0}  Senior: ${order.SeniorQty || 0}\n\nTotal: $${Number(order.Total).toFixed(2)}\nOrdered: ${fmtDate(order.PlacedAt)}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border-none"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Receipt
                </button>
                <button
                  onClick={() => {
                    const w = window.open('', '_blank', 'width=340,height=400');
                    w.document.write(`<html><head><title>QR Code</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,sans-serif;background:#f9fafb"><p style="font-weight:600;margin-bottom:1rem">Ticket #${order.TicketOrderID}</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ZOOTABASE-TICKET-${order.TicketOrderID}" alt="QR Code" /><p style="margin-top:1rem;font-size:0.75rem;color:#666">Present this at the gate</p></body></html>`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer border-none"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  View QR Code
                </button>
              </div>
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
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => alert(`Receipt for Gift Shop Order #${order.OrderID}\n\nItems: ${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}\n\nTotal: $${Number(order.Total).toFixed(2)}\nOrdered: ${fmtDate(order.PlacedAt)}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border-none"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Receipt
                </button>

              </div>
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
          <button
            onClick={async () => {
              if (!window.confirm('Are you sure you want to cancel your membership? This action cannot be undone.')) return;
              try {
                await apiPost('/api/membership-subscriptions/cancel');
                setMembership(null);
              } catch (err) {
                alert('Failed to cancel membership. Please try again.');
              }
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer border-none"
          >
            Cancel Membership
          </button>
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

  const SECTIONS = {
    account: renderAccount,
    orders: renderOrders,
    membership: renderMembership,
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
