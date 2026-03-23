import { useState, useEffect } from 'react';
import '../AdminTable.css';
import {
  Ticket, Plus, Edit2, Trash2, Star, Check, Gift, X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import {
  getTicketPackages, createTicketPackage, updateTicketPackage, deleteTicketPackage,
  getTicketAddons,   createTicketAddon,   updateTicketAddon,   deleteTicketAddon,
} from '../../../services/ticketService';

// ── Blank form states ─────────────────────────────────────────────────────────
const blankPkg = { name: '', description: '', adultPrice: '', childPrice: '', seniorPrice: '', isMostPopular: false, features: [''], sortOrder: 0 };
const blankAddon = { name: '', description: '', price: '', sortOrder: 0 };

// ── ManageTickets ─────────────────────────────────────────────────────────────
const ManageTickets = () => {
  const [packages, setPackages] = useState([]);
  const [addons,   setAddons]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Package modal state
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkg,   setEditingPkg]   = useState(null);
  const [pkgForm,      setPkgForm]      = useState(blankPkg);

  // Addon modal state
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [editingAddon,   setEditingAddon]   = useState(null);
  const [addonForm,      setAddonForm]      = useState(blankAddon);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [pkgs, ads] = await Promise.all([getTicketPackages(), getTicketAddons()]);
      setPackages(pkgs);
      setAddons(ads);
    } catch (err) {
      toast.error(err.message || 'Failed to load ticket data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Package handlers ────────────────────────────────────────────────────────
  const openPkgModal = (pkg = null) => {
    setEditingPkg(pkg);
    setPkgForm(pkg
      ? { name: pkg.name, description: pkg.description || '', adultPrice: pkg.adultPrice, childPrice: pkg.childPrice, seniorPrice: pkg.seniorPrice, isMostPopular: pkg.isMostPopular, features: pkg.features.length ? pkg.features : [''], sortOrder: pkg.sortOrder }
      : blankPkg
    );
    setPkgModalOpen(true);
  };

  const handlePkgSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...pkgForm,
      adultPrice:  parseFloat(pkgForm.adultPrice)  || 0,
      childPrice:  parseFloat(pkgForm.childPrice)  || 0,
      seniorPrice: parseFloat(pkgForm.seniorPrice) || 0,
      features: pkgForm.features.filter(f => f.trim()),
    };
    try {
      if (editingPkg) {
        await updateTicketPackage(editingPkg.packageId, payload);
        toast.success('Package updated.');
      } else {
        await createTicketPackage(payload);
        toast.success('Package created.');
      }
      setPkgModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to save package.');
    }
  };

  const handleDeletePkg = async (id) => {
    if (!window.confirm('Delete this ticket package?')) return;
    try {
      await deleteTicketPackage(id);
      setPackages(prev => prev.filter(p => p.packageId !== id));
      toast.success('Package deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    }
  };

  // Feature list helpers
  const setFeature = (i, val) => setPkgForm(f => ({ ...f, features: f.features.map((v, j) => j === i ? val : v) }));
  const addFeature  = ()     => setPkgForm(f => ({ ...f, features: [...f.features, ''] }));
  const removeFeature = (i)  => setPkgForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }));

  // ── Addon handlers ──────────────────────────────────────────────────────────
  const openAddonModal = (addon = null) => {
    setEditingAddon(addon);
    setAddonForm(addon
      ? { name: addon.name, description: addon.description || '', price: addon.price, sortOrder: addon.sortOrder }
      : blankAddon
    );
    setAddonModalOpen(true);
  };

  const handleAddonSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...addonForm, price: parseFloat(addonForm.price) || 0 };
    try {
      if (editingAddon) {
        await updateTicketAddon(editingAddon.addonId, payload);
        toast.success('Add-on updated.');
      } else {
        await createTicketAddon(payload);
        toast.success('Add-on created.');
      }
      setAddonModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to save add-on.');
    }
  };

  const handleDeleteAddon = async (id) => {
    if (!window.confirm('Delete this add-on?')) return;
    try {
      await deleteTicketAddon(id);
      setAddons(prev => prev.filter(a => a.addonId !== id));
      toast.success('Add-on deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><Ticket className="title-icon" size={26} /> Manage Tickets</h1>
          <p className="admin-page-subtitle">Configure ticket packages and add-ons shown to visitors.</p>
        </div>
      </div>

      {/* ── Section 1: Ticket Packages ─────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>
              Ticket Packages
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--adm-text-secondary)' }}>
              Shown in the "Choose Ticket Type" section on the Buy Tickets page
            </p>
          </div>
          <button className="admin-btn-primary" onClick={() => openPkgModal()}>
            <Plus size={15} /> Add Package
          </button>
        </div>

        {loading ? (
          <div className="admin-table-container">
            <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading...</p></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="admin-table-container">
            <div className="admin-table-empty">
              <div className="admin-table-empty-icon"><Ticket size={22} /></div>
              <p className="admin-table-empty-title">No packages yet</p>
              <p className="admin-table-empty-desc">Add your first ticket package to get started.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {packages.map(pkg => (
              <div key={pkg.packageId} style={{
                background: 'var(--adm-bg-surface)',
                border: `1px solid ${pkg.isMostPopular ? 'var(--adm-accent)' : 'var(--adm-border)'}`,
                borderRadius: 12,
                padding: 20,
                position: 'relative',
              }}>
                {/* Edit / Delete */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                  <button className="action-btn edit" onClick={() => openPkgModal(pkg)}><Edit2 size={14} /></button>
                  <button className="action-btn delete" onClick={() => handleDeletePkg(pkg.packageId)}><Trash2 size={14} /></button>
                </div>

                {/* Name, badge & description */}
                <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--adm-text-primary)', paddingRight: 60 }}>
                  {pkg.name}
                </h3>
                {pkg.isMostPopular && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'var(--adm-accent)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
                    padding: '3px 10px', borderRadius: 99, marginBottom: 8,
                  }}>
                    <Star size={11} fill="currentColor" /> Most Popular
                  </span>
                )}
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--adm-text-secondary)' }}>
                  {pkg.description}
                </p>

                {/* Pricing row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  {[['Adult', pkg.adultPrice], ['Child', pkg.childPrice], ['Senior', pkg.seniorPrice]].map(([lbl, val]) => (
                    <div key={lbl} style={{ flex: 1, background: 'var(--adm-bg-surface-2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--adm-text-muted)', marginBottom: 2 }}>{lbl}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--adm-accent)' }}>${Number(val).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                {pkg.features.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--adm-border-light, rgba(255,255,255,0.06))', paddingTop: 12 }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Includes
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {pkg.features.slice(0, 4).map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--adm-text-secondary)', marginBottom: 3 }}>
                          <Check size={11} color="var(--adm-accent)" style={{ flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                      {pkg.features.length > 4 && (
                        <li style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', marginTop: 2 }}>
                          +{pkg.features.length - 4} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Sort order pill */}
                <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>
                  Display order: {pkg.sortOrder}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Add-ons ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--adm-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={18} style={{ color: 'var(--adm-accent)' }} />
              Add-ons
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--adm-text-secondary)' }}>
              Shown in the "Enhance Your Visit" section on the Buy Tickets page
            </p>
          </div>
          <button className="admin-btn-primary" onClick={() => openAddonModal()}>
            <Plus size={15} /> Add Add-on
          </button>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading...</p></div>
          ) : addons.length === 0 ? (
            <div className="admin-table-empty">
              <div className="admin-table-empty-icon"><Gift size={22} /></div>
              <p className="admin-table-empty-title">No add-ons yet</p>
              <p className="admin-table-empty-desc">Add your first add-on to enhance visitor experience.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'center' }}>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addons.map(a => (
                  <tr key={a.addonId}>
                    <td><span style={{ fontWeight: 600 }}>{a.name}</span></td>
                    <td><span style={{ color: 'var(--adm-text-secondary)', fontSize: '0.85rem' }}>{a.description}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: 'var(--adm-accent)' }}>+${Number(a.price).toFixed(2)}</span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--adm-text-muted)', fontSize: '0.85rem' }}>{a.sortOrder}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => openAddonModal(a)}><Edit2 size={15} /></button>
                        <button className="action-btn delete" onClick={() => handleDeleteAddon(a.addonId)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Package Modal ────────────────────────────────────────────────────── */}
      <AdminModalForm
        title={editingPkg ? 'Edit Ticket Package' : 'Add Ticket Package'}
        isOpen={pkgModalOpen}
        onClose={() => setPkgModalOpen(false)}
        onSubmit={handlePkgSubmit}
      >
        <div className="form-group">
          <label>Package Name</label>
          <input type="text" placeholder="e.g. General Admission" value={pkgForm.name}
            onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g. Full day access to all exhibits" value={pkgForm.description}
            onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        {/* Pricing row */}
        <div className="form-row">
          <div className="form-group">
            <label>Adult Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={pkgForm.adultPrice}
              onChange={e => setPkgForm(f => ({ ...f, adultPrice: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Child Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={pkgForm.childPrice}
              onChange={e => setPkgForm(f => ({ ...f, childPrice: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Senior Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={pkgForm.seniorPrice}
              onChange={e => setPkgForm(f => ({ ...f, seniorPrice: e.target.value }))} required />
          </div>
        </div>

        {/* Most popular + sort order */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Sort Order</label>
            <input type="number" min="0" value={pkgForm.sortOrder}
              onChange={e => setPkgForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>&nbsp;</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: 40, padding: '0 12px', background: 'var(--adm-bg-surface-2)', borderRadius: 8, border: '1px solid var(--adm-border)' }}>
              <input type="checkbox" checked={pkgForm.isMostPopular}
                onChange={e => setPkgForm(f => ({ ...f, isMostPopular: e.target.checked }))} />
              <Star size={14} style={{ color: 'var(--adm-accent)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mark as Most Popular</span>
            </label>
          </div>
        </div>

        {/* Features */}
        <div className="form-group">
          <label>Included Features</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pkgForm.features.map((feat, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder={`Feature ${i + 1}`}
                  value={feat}
                  onChange={e => setFeature(i, e.target.value)}
                  style={{ flex: 1 }}
                />
                {pkgForm.features.length > 1 && (
                  <button type="button" onClick={() => removeFeature(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)', padding: '0 4px' }}>
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addFeature}
              style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--adm-border)', borderRadius: 6, padding: '4px 12px', fontSize: '0.8rem', color: 'var(--adm-accent)', cursor: 'pointer' }}>
              + Add Feature
            </button>
          </div>
        </div>
      </AdminModalForm>

      {/* ── Addon Modal ──────────────────────────────────────────────────────── */}
      <AdminModalForm
        title={editingAddon ? 'Edit Add-on' : 'Add Add-on'}
        isOpen={addonModalOpen}
        onClose={() => setAddonModalOpen(false)}
        onSubmit={handleAddonSubmit}
      >
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Name</label>
            <input type="text" placeholder="e.g. Preferred Parking" value={addonForm.name}
              onChange={e => setAddonForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={addonForm.price}
              onChange={e => setAddonForm(f => ({ ...f, price: e.target.value }))} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Description</label>
            <input type="text" placeholder="e.g. Close to entrance" value={addonForm.description}
              onChange={e => setAddonForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Sort Order</label>
            <input type="number" min="0" value={addonForm.sortOrder}
              onChange={e => setAddonForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageTickets;
