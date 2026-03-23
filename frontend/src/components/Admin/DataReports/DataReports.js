import { useState, useEffect, useMemo } from 'react';
import { FileText, Search, X, ShoppingBag, Ticket, CreditCard, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import { apiGet } from '../../../services/apiClient';
import AdminSelect from '../AdminSelect';
import AdminDatePicker from '../AdminDatePicker';
import '../AdminTable.css';
import './DataReports.css';

const SortIcon = ({ column }) => {
  if (!column.getCanSort()) return null;
  return (
    <span className="sort-icon">
      {column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> :
       column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
       <ChevronsUpDown size={12} />}
    </span>
  );
};

const fmtPlaced = (dateStr) => {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const fmtVisit = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// ── Gift Shop Detail Modal ─────────────────────────────────────────
const OrderDetailModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/api/orders/${orderId}`)
      .then(data => { setOrder(data); setLoading(false); })
      .catch(err => { toast.error(err.message || 'Failed to load order details.'); onClose(); });
  }, [orderId, onClose]);

  if (loading) return (
    <div className="dr-modal-overlay" onClick={onClose}>
      <div className="dr-modal"><div className="dr-modal-loading">Loading...</div></div>
    </div>
  );

  const { date, time } = fmtPlaced(order.PlacedAt);
  return (
    <div className="dr-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dr-modal">
        <div className="dr-modal-header">
          <div className="dr-modal-title-group">
            <ShoppingBag size={18} />
            <div>
              <h2 className="dr-modal-title">Order #{order.OrderID}</h2>
              <p className="dr-modal-subtitle">{date} at {time}</p>
            </div>
          </div>
          <button className="dr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dr-modal-body">
          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Customer</p>
            <div className="dr-detail-grid">
              <div><span className="dr-detail-label">Name</span><span className="dr-detail-value">{order.FullName}</span></div>
              <div><span className="dr-detail-label">Email</span><span className="dr-detail-value">{order.Email}</span></div>
              {order.Phone && <div><span className="dr-detail-label">Phone</span><span className="dr-detail-value">{order.Phone}</span></div>}
              {order.CardLastFour && <div><span className="dr-detail-label">Card</span><span className="dr-detail-value dr-card">•••• {order.CardLastFour}</span></div>}
            </div>
          </div>
          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Shipping Address</p>
            <p className="dr-detail-value">{order.AddressLine1}{order.AddressLine2 ? `, ${order.AddressLine2}` : ''}</p>
            <p className="dr-detail-value">{order.City}, {order.StateProvince} {order.ZipCode}</p>
          </div>
          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Items Purchased</p>
            {order.items && order.items.length > 0 ? (
              <div className="dr-items-table">
                <div className="dr-items-header">
                  <span>Item</span><span>Qty</span><span>Unit Price</span><span>Line Total</span>
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="dr-items-row">
                    <span className="dr-item-name">{item.name}</span>
                    <span className="dr-item-qty">{item.quantity}</span>
                    <span>${Number(item.price).toFixed(2)}</span>
                    <span className="dr-item-total">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dr-detail-value" style={{ color: 'var(--adm-text-secondary)' }}>No item details available.</p>
            )}
          </div>
          <div className="dr-totals">
            <div className="dr-totals-row"><span>Subtotal</span><span>${Number(order.Subtotal).toFixed(2)}</span></div>
            <div className="dr-totals-row"><span>Shipping</span><span>${Number(order.Shipping).toFixed(2)}</span></div>
            <div className="dr-totals-row"><span>Tax</span><span>${Number(order.Tax).toFixed(2)}</span></div>
            <div className="dr-totals-row dr-totals-grand"><span>Total</span><span>${Number(order.Total).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Ticket Sales Detail Modal ──────────────────────────────────────
const TicketDetailModal = ({ ticketOrderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/api/ticket-orders/${ticketOrderId}`)
      .then(data => { setOrder(data); setLoading(false); })
      .catch(err => { toast.error(err.message || 'Failed to load ticket details.'); onClose(); });
  }, [ticketOrderId, onClose]);

  if (loading) return (
    <div className="dr-modal-overlay" onClick={onClose}>
      <div className="dr-modal"><div className="dr-modal-loading">Loading...</div></div>
    </div>
  );

  const { date, time } = fmtPlaced(order.PlacedAt);
  const totalGuests = (order.AdultQty || 0) + (order.ChildQty || 0) + (order.SeniorQty || 0);

  return (
    <div className="dr-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dr-modal">
        <div className="dr-modal-header">
          <div className="dr-modal-title-group">
            <Ticket size={18} />
            <div>
              <h2 className="dr-modal-title">Ticket Order #{order.TicketOrderID}</h2>
              <p className="dr-modal-subtitle">{date} at {time}</p>
            </div>
          </div>
          <button className="dr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dr-modal-body">
          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Customer</p>
            <div className="dr-detail-grid">
              <div><span className="dr-detail-label">Name</span><span className="dr-detail-value">{order.FullName}</span></div>
              <div><span className="dr-detail-label">Email</span><span className="dr-detail-value">{order.Email}</span></div>
              {order.Phone && <div><span className="dr-detail-label">Phone</span><span className="dr-detail-value">{order.Phone}</span></div>}
              {order.CardLastFour && <div><span className="dr-detail-label">Card</span><span className="dr-detail-value dr-card">•••• {order.CardLastFour}</span></div>}
            </div>
          </div>

          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Visit Details</p>
            <div className="dr-detail-grid">
              <div><span className="dr-detail-label">Visit Date</span><span className="dr-detail-value">{fmtVisit(order.VisitDate)}</span></div>
              <div><span className="dr-detail-label">Ticket Type</span><span className="dr-detail-value">{order.TicketType}</span></div>
            </div>
          </div>

          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Tickets</p>
            <div className="dr-items-table">
              <div className="dr-items-header" style={{ gridTemplateColumns: '1fr 80px 100px' }}>
                <span>Category</span><span>Qty</span><span>Subtotal</span>
              </div>
              {[
                ['Adult',  order.AdultQty,  order.AdultUnitPrice],
                ['Child',  order.ChildQty,  order.ChildUnitPrice],
                ['Senior', order.SeniorQty, order.SeniorUnitPrice],
              ].filter(([, qty]) => qty > 0).map(([cat, qty, unitPrice]) => {
                const subtotal = unitPrice != null ? `$${(Number(unitPrice) * qty).toFixed(2)}` : '—';
                return (
                  <div key={cat} className="dr-items-row" style={{ gridTemplateColumns: '1fr 80px 100px' }}>
                    <span className="dr-item-name">{cat}</span>
                    <span className="dr-item-qty">{qty}</span>
                    <span className="dr-item-total">{subtotal}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--adm-text-secondary)' }}>
              {totalGuests} guest{totalGuests !== 1 ? 's' : ''} total
            </p>
          </div>

          {order.addOns && order.addOns.length > 0 && (
            <div className="dr-detail-section">
              <p className="dr-detail-section-title">Add-ons</p>
              <div className="dr-items-table">
                <div className="dr-items-header" style={{ gridTemplateColumns: '1fr 80px' }}>
                  <span>Add-on</span><span>Price/person</span>
                </div>
                {order.addOns.map((a, i) => (
                  <div key={i} className="dr-items-row" style={{ gridTemplateColumns: '1fr 80px' }}>
                    <span className="dr-item-name">{a.name}</span>
                    <span>${Number(a.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dr-totals">
            <div className="dr-totals-row"><span>Subtotal</span><span>${Number(order.Subtotal).toFixed(2)}</span></div>
            <div className="dr-totals-row dr-totals-grand"><span>Total</span><span>${Number(order.Total).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Membership Detail Modal ────────────────────────────────────────
const MembershipDetailModal = ({ subId, onClose }) => {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/api/membership-subscriptions/${subId}`)
      .then(data => { setSub(data); setLoading(false); })
      .catch(err => { toast.error(err.message || 'Failed to load membership details.'); onClose(); });
  }, [subId, onClose]);

  if (loading) return (
    <div className="dr-modal-overlay" onClick={onClose}>
      <div className="dr-modal"><div className="dr-modal-loading">Loading...</div></div>
    </div>
  );

  const { date, time } = fmtPlaced(sub.PlacedAt);
  return (
    <div className="dr-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dr-modal">
        <div className="dr-modal-header">
          <div className="dr-modal-title-group">
            <CreditCard size={18} />
            <div>
              <h2 className="dr-modal-title">Membership #{sub.SubID}</h2>
              <p className="dr-modal-subtitle">{date} at {time}</p>
            </div>
          </div>
          <button className="dr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dr-modal-body">
          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Member</p>
            <div className="dr-detail-grid">
              <div><span className="dr-detail-label">Name</span><span className="dr-detail-value">{sub.FullName}</span></div>
              <div><span className="dr-detail-label">Email</span><span className="dr-detail-value">{sub.Email}</span></div>
              {sub.Phone && <div><span className="dr-detail-label">Phone</span><span className="dr-detail-value">{sub.Phone}</span></div>}
              {sub.CardLastFour && <div><span className="dr-detail-label">Card</span><span className="dr-detail-value dr-card">•••• {sub.CardLastFour}</span></div>}
            </div>
          </div>

          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Membership Details</p>
            <div className="dr-detail-grid">
              <div><span className="dr-detail-label">Plan</span><span className="dr-detail-value">{sub.PlanName}</span></div>
              <div><span className="dr-detail-label">Billing</span><span className="dr-detail-value" style={{ textTransform: 'capitalize' }}>{sub.BillingPeriod}</span></div>
              <div><span className="dr-detail-label">Start</span><span className="dr-detail-value">{fmtVisit(sub.StartDate)}</span></div>
              <div><span className="dr-detail-label">Expires</span><span className="dr-detail-value">{fmtVisit(sub.EndDate)}</span></div>
            </div>
          </div>

          <div className="dr-detail-section">
            <p className="dr-detail-section-title">Address</p>
            <p className="dr-detail-value">{sub.AddressLine1}{sub.AddressLine2 ? `, ${sub.AddressLine2}` : ''}</p>
            <p className="dr-detail-value">{sub.City}, {sub.StateProvince} {sub.ZipCode}</p>
          </div>

          {!sub.BillingSameAsContact && sub.BillingAddress1 && (
            <div className="dr-detail-section">
              <p className="dr-detail-section-title">Billing Address</p>
              {sub.BillingFullName && <p className="dr-detail-value">{sub.BillingFullName}</p>}
              <p className="dr-detail-value">{sub.BillingAddress1}{sub.BillingAddress2 ? `, ${sub.BillingAddress2}` : ''}</p>
              <p className="dr-detail-value">{sub.BillingCity}, {sub.BillingState} {sub.BillingZip}</p>
            </div>
          )}

          <div className="dr-totals">
            <div className="dr-totals-row dr-totals-grand"><span>Total Charged</span><span>${Number(sub.Total).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Shared table renderer ──────────────────────────────────────────
const ReportTable = ({ data, columns, sorting, setSorting, loading, emptyText, visibleCount, onLoadMore, serverTotal }) => {
  const isServer = serverTotal !== undefined;
  const visibleData = isServer ? data : data.slice(0, visibleCount);
  const remaining = isServer ? serverTotal - data.length : data.length - visibleCount;

  const table = useReactTable({
    data: visibleData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-empty">Loading transactions...</div>
        ) : data.length === 0 ? (
          <div className="admin-table-empty">{emptyText}</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}
                        style={{ width: h.column.getSize() !== 150 ? h.column.getSize() : undefined, cursor: h.column.getCanSort() ? 'pointer' : 'default' }}
                        onClick={h.column.getToggleSortingHandler()}>
                        <div className="th-content">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          <SortIcon column={h.column} />
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {remaining > 0 && (
              <div style={{ padding: '18px 0', textAlign: 'center', borderTop: '1px solid var(--adm-border)' }}>
                <button
                  onClick={onLoadMore}
                  style={{
                    padding: '9px 24px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600,
                    background: 'var(--adm-bg-surface-2)', color: 'var(--adm-text-primary)',
                    border: '1px solid var(--adm-border)', cursor: 'pointer',
                  }}
                >
                  Load More — {remaining} remaining
                </button>
              </div>
            )}
          </>
        )}
    </div>
  );
};

// ── Date filter helpers ────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];

const computeDateRange = (dateFilter, customStart, customEnd) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (dateFilter === 'today') return { dateFrom: startOfToday.toISOString(), dateTo: null };
  if (dateFilter === 'week') {
    const s = new Date(startOfToday); s.setDate(s.getDate() - s.getDay());
    return { dateFrom: s.toISOString(), dateTo: null };
  }
  if (dateFilter === 'month') return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), dateTo: null };
  if (dateFilter === 'custom' && customStart && customEnd) {
    const e = new Date(customEnd); e.setHours(23, 59, 59, 999);
    return { dateFrom: new Date(customStart).toISOString(), dateTo: e.toISOString() };
  }
  return { dateFrom: null, dateTo: null };
};


// ── Main Page ──────────────────────────────────────────────────────
const DataReports = () => {
  const [activeTab, setActiveTab] = useState('shop');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Debounce search for all server-side fetches
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Gift shop — server-side paginated
  const [orderRows, setOrderRows] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderOffset, setOrderOffset] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [ordersSorting, setOrdersSorting] = useState([{ id: 'PlacedAt', desc: true }]);

  // Ticket sales — server-side paginated
  const [ticketRows, setTicketRows] = useState([]);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketOffset, setTicketOffset] = useState(0);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [selectedTicketOrderId, setSelectedTicketOrderId] = useState(null);
  const [ticketSorting, setTicketSorting] = useState([{ id: 'PlacedAt', desc: true }]);

  // Memberships — server-side paginated
  const [membershipRows, setMembershipRows] = useState([]);
  const [membershipTotal, setMembershipTotal] = useState(0);
  const [membershipOffset, setMembershipOffset] = useState(0);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [membershipsSorting, setMembershipsSorting] = useState([{ id: 'PlacedAt', desc: true }]);

  // Generic server-side fetch helper
  const fetchPage = (endpoint, offset, append, setRows, setTotal, setOffset, setLoading, errMsg) => {
    const { dateFrom, dateTo } = computeDateRange(dateFilter, customStart, customEnd);
    const p = new URLSearchParams({ limit: 100, offset });
    if (debouncedSearch) p.set('search', debouncedSearch);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo)   p.set('dateTo', dateTo);
    setLoading(true);
    apiGet(`${endpoint}?${p}`)
      .then(data => {
        if (append) setRows(prev => [...prev, ...data.rows]);
        else        setRows(data.rows);
        setTotal(data.total);
        setOffset(offset + data.rows.length);
      })
      .catch(err => toast.error(err.message || errMsg))
      .finally(() => setLoading(false));
  };

  // Lazy-load each tab only when active; re-fetch on filter/search change
  useEffect(() => {
    if (activeTab !== 'shop') return;
    fetchPage('/api/orders', 0, false, setOrderRows, setOrderTotal, setOrderOffset, setOrdersLoading, 'Failed to load shop orders.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, dateFilter, customStart, customEnd]);

  useEffect(() => {
    if (activeTab !== 'tickets') return;
    fetchPage('/api/ticket-orders', 0, false, setTicketRows, setTicketTotal, setTicketOffset, setTicketLoading, 'Failed to load ticket orders.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, dateFilter, customStart, customEnd]);

  useEffect(() => {
    if (activeTab !== 'memberships') return;
    fetchPage('/api/membership-subscriptions', 0, false, setMembershipRows, setMembershipTotal, setMembershipOffset, setMembershipsLoading, 'Failed to load memberships.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, dateFilter, customStart, customEnd]);

  // All tabs are filtered server-side — no client filtering needed

  const shopColumns = useMemo(() => [
    { accessorKey: 'OrderID', header: 'Order #', size: 80, cell: info => <span className="dr-order-id">#{info.getValue()}</span> },
    { accessorKey: 'FullName', header: 'Customer', cell: info => <span style={{ fontWeight: 600 }}>{info.getValue()}</span> },
    { accessorKey: 'Email', header: 'Email', cell: info => <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{info.getValue()}</span> },
    { accessorKey: 'PlacedAt', header: 'Date', cell: info => <span>{fmtPlaced(info.getValue()).date}</span> },
    { accessorKey: '_time', header: 'Time', enableSorting: false, cell: info => <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{fmtPlaced(info.row.original.PlacedAt).time}</span> },
    { accessorKey: 'Total', header: 'Total', cell: info => <span className="dr-total-badge">${Number(info.getValue()).toFixed(2)}</span> },
    { id: 'actions', header: '', enableSorting: false, size: 110, cell: info => <button className="dr-details-btn" onClick={() => setSelectedOrderId(info.row.original.OrderID)}>View Details</button> },
  ], []);

  const ticketColumns = useMemo(() => [
    { accessorKey: 'TicketOrderID', header: 'Order #', size: 80, cell: info => <span className="dr-order-id">#{info.getValue()}</span> },
    { accessorKey: 'FullName', header: 'Customer', cell: info => <span style={{ fontWeight: 600 }}>{info.getValue()}</span> },
    { accessorKey: 'Email', header: 'Email', cell: info => <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{info.getValue()}</span> },
    { accessorKey: 'TicketType', header: 'Ticket Type', cell: info => <span style={{ fontSize: '0.82rem' }}>{info.getValue()}</span> },
    { accessorKey: 'VisitDate', header: 'Visit Date', cell: info => <span>{fmtVisit(info.getValue())}</span> },
    { accessorKey: 'PlacedAt', header: 'Purchased', cell: info => {
        const { date, time } = fmtPlaced(info.getValue());
        return <span style={{ fontSize: '0.82rem' }}>{date}<br /><span style={{ color: 'var(--adm-text-secondary)' }}>{time}</span></span>;
      }
    },
    { accessorKey: 'Total', header: 'Total', cell: info => <span className="dr-total-badge">${Number(info.getValue()).toFixed(2)}</span> },
    { id: 'actions', header: '', enableSorting: false, size: 110, cell: info => <button className="dr-details-btn" onClick={() => setSelectedTicketOrderId(info.row.original.TicketOrderID)}>View Details</button> },
  ], []);

  const membershipColumns = useMemo(() => [
    { accessorKey: 'SubID', header: 'Sub #', size: 80, cell: info => <span className="dr-order-id">#{info.getValue()}</span> },
    { accessorKey: 'FullName', header: 'Member', cell: info => <span style={{ fontWeight: 600 }}>{info.getValue()}</span> },
    { accessorKey: 'Email', header: 'Email', cell: info => <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>{info.getValue()}</span> },
    { accessorKey: 'PlanName', header: 'Plan', cell: info => <span style={{ fontWeight: 600, color: 'var(--adm-accent)' }}>{info.getValue()}</span> },
    { accessorKey: 'BillingPeriod', header: 'Billing', size: 90, cell: info => (
        <span style={{ background: info.getValue() === 'yearly' ? '#dcfce7' : '#dbeafe', color: info.getValue() === 'yearly' ? '#166534' : '#1e40af', padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
          {info.getValue()}
        </span>
      )
    },
    { accessorKey: 'PlacedAt', header: 'Purchased', cell: info => {
        const { date, time } = fmtPlaced(info.getValue());
        return <span style={{ fontSize: '0.82rem' }}>{date}<br /><span style={{ color: 'var(--adm-text-secondary)' }}>{time}</span></span>;
      }
    },
    { accessorKey: 'Total', header: 'Total', cell: info => <span className="dr-total-badge">${Number(info.getValue()).toFixed(2)}</span> },
    { id: 'actions', header: '', enableSorting: false, size: 110, cell: info => <button className="dr-details-btn" onClick={() => setSelectedSubId(info.row.original.SubID)}>View Details</button> },
  ], []);

  const activeCount = activeTab === 'shop' ? orderTotal
    : activeTab === 'tickets' ? ticketTotal
    : membershipTotal;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            <FileText size={26} style={{ color: 'var(--adm-accent)', marginRight: 12, flexShrink: 0 }} />
            Data Reports
          </h1>
          <p className="admin-page-subtitle">Purchase transaction history across all sales channels</p>
        </div>
      </div>

      <div className="dr-tabs">
        <button className={`dr-tab${activeTab === 'shop' ? ' active' : ''}`} onClick={() => { setActiveTab('shop'); setSearch(''); setDateFilter('today'); setCustomStart(''); setCustomEnd(''); }}>
          <ShoppingBag size={14} /> Gift Shop Orders
        </button>
        <button className={`dr-tab${activeTab === 'tickets' ? ' active' : ''}`} onClick={() => { setActiveTab('tickets'); setSearch(''); setDateFilter('today'); setCustomStart(''); setCustomEnd(''); }}>
          <Ticket size={14} /> Ticket Sales
        </button>
        <button className={`dr-tab${activeTab === 'memberships' ? ' active' : ''}`} onClick={() => { setActiveTab('memberships'); setSearch(''); setDateFilter('today'); setCustomStart(''); setCustomEnd(''); }}>
          <CreditCard size={14} /> Memberships
        </button>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-search-container">
          <Search size={15} className="search-icon" />
          <input
            className="admin-search-input"
            placeholder={
              activeTab === 'shop' ? 'Search by name, email, or order #...' :
              activeTab === 'tickets' ? 'Search by name, email, or ticket type...' :
              'Search by name, email, or plan...'
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="dr-count">{activeCount} transaction{activeCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Date filter row — right-aligned above the table */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {dateFilter === 'custom' && (
          <>
            <AdminDatePicker
              value={customStart}
              onChange={setCustomStart}
              placeholder="Start date"
              maxDate={customEnd || TODAY}
            />
            <span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.82rem' }}>to</span>
            <AdminDatePicker
              value={customEnd}
              onChange={setCustomEnd}
              placeholder="End date"
              minDate={customStart || undefined}
              maxDate={TODAY}
            />
          </>
        )}
        <AdminSelect
          value={dateFilter}
          onChange={v => { setDateFilter(v); setCustomStart(''); setCustomEnd(''); }}
          width="148px"
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'custom', label: 'Custom Range' },
          ]}
        />
      </div>

      {activeTab === 'shop' ? (
        <ReportTable
          data={orderRows}
          columns={shopColumns}
          sorting={ordersSorting}
          setSorting={setOrdersSorting}
          loading={ordersLoading}
          emptyText={search ? 'No orders match your search.' : 'No shop orders today.'}
          serverTotal={orderTotal}
          onLoadMore={() => fetchPage('/api/orders', orderOffset, true, setOrderRows, setOrderTotal, setOrderOffset, setOrdersLoading, 'Failed to load shop orders.')}
        />
      ) : activeTab === 'tickets' ? (
        <ReportTable
          data={ticketRows}
          columns={ticketColumns}
          sorting={ticketSorting}
          setSorting={setTicketSorting}
          loading={ticketLoading}
          emptyText={search ? 'No ticket orders match your search.' : 'No ticket sales today.'}
          serverTotal={ticketTotal}
          onLoadMore={() => fetchPage('/api/ticket-orders', ticketOffset, true, setTicketRows, setTicketTotal, setTicketOffset, setTicketLoading, 'Failed to load ticket orders.')}
        />
      ) : (
        <ReportTable
          data={membershipRows}
          columns={membershipColumns}
          sorting={membershipsSorting}
          setSorting={setMembershipsSorting}
          loading={membershipsLoading}
          emptyText={search ? 'No memberships match your search.' : 'No memberships today.'}
          serverTotal={membershipTotal}
          onLoadMore={() => fetchPage('/api/membership-subscriptions', membershipOffset, true, setMembershipRows, setMembershipTotal, setMembershipOffset, setMembershipsLoading, 'Failed to load memberships.')}
        />
      )}

      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
      {selectedTicketOrderId && <TicketDetailModal ticketOrderId={selectedTicketOrderId} onClose={() => setSelectedTicketOrderId(null)} />}
      {selectedSubId && <MembershipDetailModal subId={selectedSubId} onClose={() => setSelectedSubId(null)} />}
    </div>
  );
};

export default DataReports;
