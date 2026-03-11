import React, { useState } from 'react';
import '../AdminTable.css';
import { ShoppingBag, Search, Plus, Edit2, Trash2 } from 'lucide-react';

import AdminModalForm from '../AdminModalForm';

// Mapping to Product Schema: ProductID, ProductName, Category, Price, StockQuantity
const initialProducts = [
  { id: '1', name: 'Leo the Lion Plushie', sku: 'SKU-0001', category: 'Plushies', price: 24.99, stockQuantity: 50 },
  { id: '2', name: 'WildHaven Zoo T-Shirt', sku: 'SKU-0002', category: 'Apparel', price: 19.99, stockQuantity: 120 },
  { id: '3', name: 'Animals of the World Coloring Book', sku: 'SKU-0003', category: 'Books', price: 12.50, stockQuantity: 85 },
  { id: '4', name: 'Penguin Coast Mug', sku: 'SKU-0004', category: 'Souvenirs', price: 14.99, stockQuantity: 0 },
];

const ManageShop = () => {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State aligned with Product Schema
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    stockQuantity: 0
  });

  const filteredProducts = products.filter(prod => 
    prod.name.toLowerCase().includes(search.toLowerCase()) || 
    prod.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', sku: `SKU-000${products.length + 1}`, category: '', price: 0, stockQuantity: 0 });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p));
    } else {
      const newProduct = { ...formData, id: Date.now().toString() };
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title">
            Manage Gift Shop
          </h1>
          <p className="admin-page-subtitle">Add, update, or remove products from the zoo gift shop.</p>
        </div>
        
        <div className="admin-page-actions">
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="admin-search-container" style={{ width: '100%' }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or category..." 
              className="admin-search-input"
              style={{ width: '100%', maxWidth: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th className="align-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((prod) => {
              const stockStatus = prod.stockQuantity > 0 ? 'In Stock' : 'Out of Stock';
              return (
              <tr key={prod.id}>
                <td>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={20} color="#94a3b8" />
                  </div>
                </td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start'}}>
                    <span className="font-medium text-dark">{prod.name}</span>
                    <span className="text-secondary" style={{fontSize: '0.8rem'}}>{prod.sku}</span>
                  </div>
                </td>
                <td><span className="pill-badge outline" style={{color: '#9a3412', borderColor: '#fdba74', backgroundColor: '#fff7ed'}}>{prod.category}</span></td>
                <td className="font-medium text-dark">${Number(prod.price).toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${stockStatus === 'In Stock' ? 'open' : 'closed'}`}>
                    <span className="status-indicator-dot" style={{ backgroundColor: stockStatus === 'In Stock' ? '#22c55e' : '#ef4444' }}></span>
                    <span className={stockStatus === 'In Stock' ? 'text-green-700' : 'text-red-700'} style={{fontWeight: 600}}>
                      {stockStatus} 
                    </span>
                    <span className="text-secondary ml-1">({prod.stockQuantity})</span>
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleOpenModal(prod)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(prod.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            )})}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '32px', color: '#64748b'}}>
                  No products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModalForm 
        title={editingProduct ? "Edit Product" : "Add New Product"} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label>Product Name</label>
          <input type="text" placeholder="e.g. Leo the Lion Plushie" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>SKU (Stock Keeping Unit)</label>
            <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" placeholder="e.g. Plushies, Apparel" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input type="number" min="0" placeholder="0" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} required />
          </div>
        </div>
      </AdminModalForm>

    </div>
  );
};

export default ManageShop;
