import { useState, useEffect, useMemo } from 'react';
import { FileText, Search, X, ShoppingBag, Ticket, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import { apiGet } from '../../../services/apiClient';
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
              {order.AdultQty > 0 && (
                <div className="dr-items-row" style={{ gridTemplateColumns: '1fr 80px 100px' }}>
                  <span className="dr-item-name">Adult</span>
                  <span className="dr-item-qty">{order.AdultQty}</span>
                  <span className="dr-item-total">—</span>
                </div>
              )}
              {order.ChildQty > 0 && (
                <div className="dr-items-row" style={{ gridTemplateColumns: '1fr 80px 100px' }}>
                  <span className="dr-item-name">Child</span>
                  <span className="dr-item-qty">{order.ChildQty}</span>
                  <span className="dr-item-total">—</span>
                </div>
              )}
              {order.SeniorQty > 0 && (
                <div className="dr-items-row" style={{ gridTemplateColumns: '1fr 80px 100px' }}>
                  <span className="dr-item-name">Senior</span>
                  <span className="dr-item-qty">{order.SeniorQty}</span>
                  <span className="dr-item-total">—</span>
                </div>
              )}
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

          {order.BillingAddress && (
            <div className="dr-detail-section">
              <p className="dr-detail-section-title">Billing Address</p>
              <p className="dr-detail-value">{order.BillingAddress}</p>
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

// ── Shared table renderer ──────────────────────────────────────────
const ReportTable = ({ data, columns, sorting, setSorting, loading, emptyText }) => {
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <>
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-empty">Loading transactions...</div>
        ) : data.length === 0 ? (
          <div className="admin-table-empty">{emptyText}</div>
        ) : (
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
        )}
      </div>
      {!loading && data.length > 0 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>← Prev</button>
          <span className="admin-page-info">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <button className="admin-page-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next →</button>
        </div>
      )}
    </>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
const DataReports = () => {
  const [activeTab, setActiveTab] = useState('shop');
  const [search, setSearch] = useState('');

  // Gift shop
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [ordersSorting, setOrdersSorting] = useState([{ id: 'PlacedAt', desc: true }]);

  // Ticket sales
  const [ticketOrders, setTicketOrders] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [selectedTicketOrderId, setSelectedTicketOrderId] = useState(null);
  const [ticketSorting, setTicketSorting] = useState([{ id: 'PlacedAt', desc: true }]);

  useEffect(() => {
    apiGet('/api/orders')
      .then(data => { setOrders(data); setOrdersLoading(false); })
      .catch(err => { toast.error(err.message || 'Failed to load shop orders.'); setOrdersLoading(false); });
    apiGet('/api/ticket-orders')
      .then(data => { setTicketOrders(data); setTicketLoading(false); })
      .catch(err => { toast.error(err.message || 'Failed to load ticket orders.'); setTicketLoading(false); });
  }, []);

  const filteredOrders = useMemo(() =>
    orders.filter(o =>
      o.FullName?.toLowerCase().includes(search.toLowerCase()) ||
      o.Email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.OrderID).includes(search)
    ), [orders, search]);

  const filteredTickets = useMemo(() =>
    ticketOrders.filter(o =>
      o.FullName?.toLowerCase().includes(search.toLowerCase()) ||
      o.Email?.toLowerCase().includes(search.toLowerCase()) ||
      o.TicketType?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.TicketOrderID).includes(search)
    ), [ticketOrders, search]);

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

  const activeCount = activeTab === 'shop' ? filteredOrders.length : filteredTickets.length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <FileText size={22} className="admin-page-icon" />
          <div>
            <h1 className="admin-page-title">Data Reports</h1>
            <p className="admin-page-subtitle">Purchase transaction history across all sales channels</p>
          </div>
        </div>
      </div>

      <div className="dr-tabs">
        <button className={`dr-tab${activeTab === 'shop' ? ' active' : ''}`} onClick={() => { setActiveTab('shop'); setSearch(''); }}>
          <ShoppingBag size={14} /> Gift Shop Orders
        </button>
        <button className={`dr-tab${activeTab === 'tickets' ? ' active' : ''}`} onClick={() => { setActiveTab('tickets'); setSearch(''); }}>
          <Ticket size={14} /> Ticket Sales
        </button>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-search-container">
          <Search size={15} className="search-icon" />
          <input
            className="admin-search-input"
            placeholder={activeTab === 'shop' ? 'Search by name, email, or order #...' : 'Search by name, email, or ticket type...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="dr-count">{activeCount} transaction{activeCount !== 1 ? 's' : ''}</span>
      </div>

      {activeTab === 'shop' ? (
        <ReportTable
          data={filteredOrders}
          columns={shopColumns}
          sorting={ordersSorting}
          setSorting={setOrdersSorting}
          loading={ordersLoading}
          emptyText={search ? 'No orders match your search.' : 'No shop orders yet.'}
        />
      ) : (
        <ReportTable
          data={filteredTickets}
          columns={ticketColumns}
          sorting={ticketSorting}
          setSorting={setTicketSorting}
          loading={ticketLoading}
          emptyText={search ? 'No ticket orders match your search.' : 'No ticket sales yet.'}
        />
      )}

      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
      {selectedTicketOrderId && <TicketDetailModal ticketOrderId={selectedTicketOrderId} onClose={() => setSelectedTicketOrderId(null)} />}
    </div>
  );
};

export default DataReports;
