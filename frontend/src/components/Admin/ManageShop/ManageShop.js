import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { ShoppingBag, Search, Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import AdminSelect from '../AdminSelect';
import productService from '../../../services/productService';
import { API_BASE_URL } from '../../../services/apiClient';

const CATEGORY_COLORS = {
  'Plush Toys & Stuffed Animals': { background: '#f3e8ff', color: '#6b21a8', borderColor: '#d8b4fe' },
  'Apparel & Wearables':          { background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
  'Souvenirs & Memorabilia':      { background: '#fef9c3', color: '#854d0e', borderColor: '#fde047' },
  'Books & Educational Items':    { background: '#dcfce7', color: '#166534', borderColor: '#86efac' },
  'Toys & Games':                 { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' },
  'Home & Decor':                 { background: '#ccfbf1', color: '#065f46', borderColor: '#5eead4' },
  'Jewelry & Accessories':        { background: '#fce7f3', color: '#9d174d', borderColor: '#f9a8d4' },
  'Art & Collectibles':           { background: '#e0e7ff', color: '#3730a3', borderColor: '#a5b4fc' },
};

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

const CATEGORY_OPTIONS = Object.keys(CATEGORY_COLORS);

const ManageShop = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [formData, setFormData] = useState({
    name: '', category: '', price: 0, stockQuantity: 0, lowStockThreshold: 10,
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error(err.message || 'Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredProducts = useMemo(() =>
    products.filter(prod => {
      const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) ||
        (prod.category || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !filterCategory || prod.category === filterCategory;
      return matchesSearch && matchesCategory;
    }), [products, search, filterCategory]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category || '',
        price: product.price,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold ?? 10,
      });
      setPreviewUrl(product.imageUrl ? (product.imageUrl?.startsWith('http') ? product.imageUrl : `${API_BASE_URL}${product.imageUrl}`) : null);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', price: 0, stockQuantity: 0, lowStockThreshold: 10 });
      setPreviewUrl(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Product deleted.');
      } catch (err) {
        toast.error(err.message || 'Failed to delete product.');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let productId;
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        productId = editingProduct.id;
      } else {
        const created = await productService.createProduct(formData);
        productId = created.id;
      }
      if (imageFile) {
        await productService.uploadProductImage(productId, imageFile);
      }
      toast.success(editingProduct ? 'Product updated.' : 'Product created.');
      await loadData();
      setIsModalOpen(false);
      setImageFile(null);
      setPreviewUrl(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save product.');
      console.error(err);
    }
  };

  const columns = useMemo(() => [
    {
      id: 'image',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const img = row.original.imageUrl;
        return img ? (
          <img
            src={(img?.startsWith('http') ? img : `${API_BASE_URL}${img}`)}
            alt=""
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--adm-border)', display: 'block' }}
          />
        ) : (
          <div style={{ width: 36, height: 36, background: 'var(--adm-bg-surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)' }}>
            <ShoppingBag size={18} style={{ color: 'var(--adm-text-muted)' }} />
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: info => <span className="font-medium text-dark">{info.getValue()}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: info => {
        const cat = info.getValue();
        const s = CATEGORY_COLORS[cat] || { background: '#fff7ed', color: '#9a3412', borderColor: '#fdba74' };
        return (
          <span className="pill-badge outline" style={{ backgroundColor: s.background, color: s.color, border: `1px solid ${s.borderColor}` }}>
            {cat}
          </span>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => (
        <span className="font-medium text-dark">${Number(info.getValue() || 0).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => {
        const qty = row.original.stockQuantity;
        const threshold = row.original.lowStockThreshold ?? 10;
        const isOut = qty <= 0;
        const isLow = !isOut && qty <= threshold;
        return (
          <span className="pill-badge outline"
            style={isOut
              ? { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
              : isLow
              ? { background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }
              : { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
            {isOut ? 'Out of Stock' : isLow ? `Low Stock (${qty})` : `In Stock (${qty})`}
          </span>
        );
      },
    },
    {
      id: 'modifiedBy',
      header: 'Modified By',
      enableSorting: false,
      cell: ({ row }) => {
        const { createdBy, updatedBy } = row.original;
        if (updatedBy) return <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Updated by <strong>{updatedBy}</strong></span>;
        if (createdBy) return <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Created by <strong>{createdBy}</strong></span>;
        return <span className="text-secondary">—</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="action-buttons">
          <button className="action-btn edit" onClick={() => handleOpenModal(row.original)}><Edit2 size={16} /></button>
          <button className="action-btn delete" onClick={() => handleDelete(row.original.id)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], [products]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><ShoppingBag className="title-icon" size={26} /> Manage Gift Shop</h1>
          <p className="admin-page-subtitle">Add, update, or remove products from the zoo gift shop.</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Search products..." className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            className="admin-filter-select"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface)', color: 'var(--adm-text-primary)', fontSize: '0.82rem', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      data-sorted={header.column.getIsSorted() || undefined}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon column={header.column} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading products...</p></div>
              </td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="no-hover"><td colSpan={columns.length}>
                <div className="admin-table-empty">
                  <div className="admin-table-empty-icon"><ShoppingBag size={22} /></div>
                  <p className="admin-table-empty-title">No products found</p>
                  <p className="admin-table-empty-desc">
                    {search ? 'Try adjusting your search.' : 'Add your first product to get started.'}
                  </p>
                </div>
              </td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={cell.column.id === 'image' ? { paddingRight: 6, width: 52 } : {}}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && table.getPageCount() > 1 && (() => {
          const pageCount = table.getPageCount();
          const pi = table.getState().pagination.pageIndex;
          let pages = [];
          if (pageCount <= 6) {
            pages = Array.from({ length: pageCount }, (_, i) => i);
          } else {
            if (pi <= 2) {
              pages = [0, 1, 2, 3, 4, '...', pageCount - 1];
            } else if (pi >= pageCount - 3) {
              pages = [0, '...', pageCount - 5, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1];
            } else {
              pages = [0, '...', pi - 1, pi, pi + 1, '...', pageCount - 1];
            }
          }
          return (
            <div className="admin-table-pagination" style={{ borderTop: '1px solid var(--adm-border)' }}>
              <span className="admin-pagination-info">
                Page {pi + 1} of {pageCount} · {filteredProducts.length} records
              </span>
              <div className="admin-pagination-controls">
                <button className="admin-pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeft size={14} />
                </button>
                {pages.map((p, idx) => (
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 8px', color: 'var(--adm-text-secondary)' }}>...</span>
                  ) : (
                    <button key={p} className={`admin-pagination-btn${pi === p ? ' active' : ''}`} onClick={() => table.setPageIndex(p)}>
                      {p + 1}
                    </button>
                  )
                ))}
                <button className="admin-pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <AdminModalForm title={editingProduct ? 'Edit Product' : 'Add New Product'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label>Product Name</label>
          <input type="text" placeholder="e.g. Leo the Lion Plushie" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </div>

        {/* Category + Price */}
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <AdminSelect
              value={formData.category}
              onChange={val => setFormData({ ...formData, category: val })}
              placeholder="Select Category"
              options={[
                { value: 'Plush Toys & Stuffed Animals', label: 'Plush Toys & Stuffed Animals' },
                { value: 'Apparel & Wearables', label: 'Apparel & Wearables' },
                { value: 'Souvenirs & Memorabilia', label: 'Souvenirs & Memorabilia' },
                { value: 'Books & Educational Items', label: 'Books & Educational Items' },
                { value: 'Toys & Games', label: 'Toys & Games' },
                { value: 'Home & Decor', label: 'Home & Decor' },
                { value: 'Jewelry & Accessories', label: 'Jewelry & Accessories' },
                { value: 'Art & Collectibles', label: 'Art & Collectibles' },
              ]}
            />
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
          </div>
        </div>

        {/* Stock + Low Stock Threshold */}
        <div className="form-row">
          <div className="form-group">
            <label>Stock Quantity</label>
            <input type="number" min="0" placeholder="0" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} required />
          </div>
          <div className="form-group">
            <label>Low Stock Warning (qty)</label>
            <input type="number" min="1" placeholder="10" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })} required />
          </div>
        </div>

        {/* Image upload */}
        <div className="form-group">
          <label>Product Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview"
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--adm-border)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--adm-bg-surface-2)', border: '1px dashed var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ImageIcon size={22} style={{ color: 'var(--adm-text-muted)' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'block', width: '100%' }} />
              <small className="text-secondary" style={{ marginTop: 4, display: 'block' }}>If no image is provided, a placeholder will be used.</small>
            </div>
          </div>
        </div>
      </AdminModalForm>
    </div>
  );
};

export default ManageShop;
