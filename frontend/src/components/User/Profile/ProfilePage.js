import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../services/firebase';
import { apiGet, apiPost } from '../../../services/apiClient';
import {
  Calendar, ChevronRight, CreditCard, LogOut, Mail,
  Package, Ticket, User, Star, Eye, QrCode, X, Printer,
  ShoppingBag,
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
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);
  const [orderTab, setOrderTab] = useState('tickets');



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

  /* ── Receipt Modal ── */
  const openReceipt = (order, type) => setReceiptData({ order, type });
  const closeReceipt = () => setReceiptData(null);

  const handlePrint = () => {
    const el = receiptRef.current;
    if (!el) return;
    const printWindow = window.open('', '_blank', 'width=420,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #1a1a1a; }
            .receipt-header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px dashed #d1d5db; }
            .receipt-header h2 { font-size: 1.25rem; margin-bottom: 0.25rem; }
            .receipt-header p { font-size: 0.75rem; color: #6b7280; }
            .receipt-section { margin-bottom: 1rem; }
            .receipt-section h3 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 0.5rem; }
            .receipt-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.25rem 0; }
            .receipt-row.total { font-weight: 700; font-size: 1rem; border-top: 1px solid #d1d5db; padding-top: 0.5rem; margin-top: 0.5rem; }
            .receipt-divider { border: none; border-top: 1px dashed #d1d5db; margin: 1rem 0; }
            .receipt-footer { text-align: center; font-size: 0.7rem; color: #9ca3af; margin-top: 1.5rem; }
            @media print { body { padding: 1rem; } }
          </style>
        </head>
        <body>
          ${el.innerHTML}
          <script>window.onload=function(){window.print();}<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const ReceiptModal = () => {
    if (!receiptData) return null;
    const { order, type } = receiptData;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={closeReceipt}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 m-0">Receipt</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer border-none"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                onClick={closeReceipt}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Printable receipt content */}
          <div ref={receiptRef} className="px-6 py-5">
            {/* Receipt header */}
            <div className="receipt-header text-center mb-5 pb-4" style={{ borderBottom: '2px dashed #d1d5db' }}>
              <h2 className="text-xl font-bold text-gray-900 m-0">Zootabase</h2>
              <p className="text-xs text-gray-500 mt-1 m-0">Thank you for your purchase!</p>
              <p className="text-xs text-gray-400 mt-2 m-0 font-medium">
                Order #{type === 'ticket' ? order.TicketOrderID : order.OrderID}
              </p>
            </div>

            {type === 'ticket' ? (
              <>
                {/* Ticket receipt */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium m-0 mb-2">Ticket Details</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ticket Type</span>
                      <span className="font-medium text-gray-900">{order.TicketType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Visit Date</span>
                      <span className="font-medium text-gray-900">{fmtDate(order.VisitDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium m-0 mb-2">Guests</p>
                  <div className="space-y-1">
                    {order.AdultQty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Adult x {order.AdultQty}</span>
                      </div>
                    )}
                    {order.ChildQty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Child x {order.ChildQty}</span>
                      </div>
                    )}
                    {order.SeniorQty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Senior x {order.SeniorQty}</span>
                      </div>
                    )}
                  </div>
                </div>

                {order.addOns && order.addOns.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium m-0 mb-2">Add-Ons</p>
                    <div className="space-y-1">
                      {order.addOns.map((a, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{a.name || a.Name}</span>
                          {(a.price || a.Price) != null && (
                            <span className="text-gray-900">${Number(a.price || a.Price).toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Gift shop receipt */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium m-0 mb-2">Items Purchased</p>
                  <div className="space-y-2">
                    {order.items.map((item, i) => {
                      const qty = item.quantity || item.qty || 1;
                      return (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.name} <span className="text-gray-400">x{qty}</span>
                          </span>
                          {item.price != null && (
                            <span className="text-gray-900">${(Number(item.price) * Number(qty)).toFixed(2)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(order.Subtotal || order.Shipping || order.Tax) && (
                  <div className="mb-2 space-y-1">
                    {order.Subtotal != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-700">${Number(order.Subtotal).toFixed(2)}</span>
                      </div>
                    )}
                    {order.Shipping != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span className="text-gray-700">${Number(order.Shipping).toFixed(2)}</span>
                      </div>
                    )}
                    {order.Tax != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span className="text-gray-700">${Number(order.Tax).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Total */}
            <div className="border-t-2 border-dashed border-gray-200 pt-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">${Number(order.Total).toFixed(2)}</span>
              </div>
            </div>

            {/* Order date */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 m-0">Order Date: {fmtDate(order.PlacedAt)}</p>
            </div>

            {/* Footer */}
            <div className="receipt-footer mt-5 text-center">
              <p className="text-xs text-gray-300 m-0">Thank you for visiting Zootabase!</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    const hasTickets = ticketOrders.length > 0;
    const hasShop = shopOrders.length > 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground m-0">Order History</h2>
          <p className="text-sm text-muted-foreground mt-1 m-0">Your past purchases</p>
        </div>

        {ordersLoading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading orders...</p>
        ) : (!hasTickets && !hasShop) ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground m-0 text-sm">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setOrderTab('tickets')}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none",
                  orderTab === 'tickets'
                    ? "bg-white text-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Ticket className="h-4 w-4" />
                Tickets
                {hasTickets && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{ticketOrders.length}</span>
                )}
              </button>
              <button
                onClick={() => setOrderTab('shop')}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none",
                  orderTab === 'shop'
                    ? "bg-white text-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                Gift Shop
                {hasShop && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{shopOrders.length}</span>
                )}
              </button>
            </div>

            {/* Ticket orders tab */}
            {orderTab === 'tickets' && (
              <div className="space-y-3">
                {!hasTickets ? (
                  <div className="text-center py-10 bg-card rounded-xl border border-border">
                    <Ticket className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground m-0 text-sm">No ticket orders yet.</p>
                  </div>
                ) : (
                  ticketOrders.map((order) => (
                    <div key={`t-${order.TicketOrderID}`} className="bg-card rounded-xl border border-border p-4">
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
                          onClick={() => openReceipt(order, 'ticket')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border-none"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Receipt
                        </button>
                        <button
                          onClick={() => {
                            const w = window.open('', '_blank', 'width=340,height=400');
                            w.document.write(`<html><head><title>QR Code</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,sans-serif;background:#f9fafb"><p style="font-weight:600;margin-bottom:1rem">Ticket — ${order.TicketType}</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ZOOTABASE-TICKET-${order.TicketOrderID}" alt="QR Code" /><p style="margin-top:1rem;font-size:0.75rem;color:#666">Present this at the gate</p></body></html>`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer border-none"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          QR Code
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Shop orders tab */}
            {orderTab === 'shop' && (
              <div className="space-y-3">
                {!hasShop ? (
                  <div className="text-center py-10 bg-card rounded-xl border border-border">
                    <ShoppingBag className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground m-0 text-sm">No gift shop orders yet.</p>
                  </div>
                ) : (
                  shopOrders.map((order) => (
                    <div key={`s-${order.OrderID}`} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground m-0 text-sm">
                            {order.items.length > 0
                              ? order.items.map(i => i.name).join(', ')
                              : 'Gift Shop Order'}
                          </p>
                          <p className="text-xs text-muted-foreground m-0 mt-1">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <span className="font-semibold text-foreground text-sm">${Number(order.Total).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-2 m-0">Ordered {fmtDate(order.PlacedAt)}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <button
                          onClick={() => openReceipt(order, 'shop')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border-none"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

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
      <ReceiptModal />
    </div>
  );
};

export default ProfilePage;
