import React, { useEffect, useState, useCallback } from 'react';
import './ProductPage.css';
import { getAllProducts } from '../../../services/productService';
import { Search, Grid, List, ShoppingCart, Heart, Star } from 'lucide-react';

const CATEGORIES = ['All Products', 'Gift Shop', 'Food', 'Beverage'];

const EMOJI_MAP = {
  'Gift Shop': '🧸',
  'Food': '🍿',
  'Beverage': '☕',
};

// Badge logic based on array index for demo variety
function getBadge(index) {
  const badges = [
    { label: 'Best Seller', className: 'badge-bestseller' },
    { label: 'New', className: 'badge-new' },
    null,
    { label: 'Popular', className: 'badge-popular' },
    { label: 'Sale', className: 'badge-sale' },
    null,
    { label: 'New', className: 'badge-new' },
    null,
  ];
  return badges[index % badges.length];
}

function getRating(index) {
  const ratings = [4.8, 4.9, 4.7, 4.8, 4.6, 4.9, 4.5, 4.7];
  const reviews = [156, 203, 89, 134, 78, 312, 44, 97];
  return { rating: ratings[index % ratings.length], reviews: reviews[index % reviews.length] };
}

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Products');
  const [gridView, setGridView] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [liked, setLiked] = useState({});
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProducts();
        setProducts(Array.isArray(data) && data.length ? data : []);
      } catch (error) {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'All Products' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = useCallback((product) => {
    setCart(prev => [...prev, product]);
    setIsCartOpen(true);
    setToast(`"${product.name}" added to cart!`);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleLike = useCallback((id) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div className="shop-page">
      {/* ── Hero ── */}
      <section className="shop-hero">
        <div className="shop-hero-bg" />
        <div className="shop-hero-content">
          <span className="shop-online-badge">Shop Online</span>
          <h1 className="shop-hero-title">Gift Shop</h1>
          <p className="shop-hero-subtitle">
            Take home a piece of the wild. Browse our collection of plush toys,
            apparel, and unique souvenirs.
          </p>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <div className="shop-toolbar">
        {/* Search */}
        <div className="shop-search-wrapper">
          <Search className="shop-search-icon" size={15} />
          <input
            className="shop-search-input"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="shop-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View toggles + Cart */}
        <div className="shop-toolbar-right">
          <button
            className={`view-btn ${gridView ? 'active' : ''}`}
            onClick={() => setGridView(true)}
            title="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            className={`view-btn ${!gridView ? 'active' : ''}`}
            onClick={() => setGridView(false)}
            title="List view"
          >
            <List size={16} />
          </button>
          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={16} />
            Cart
            {cart.length > 0 && (
              <span className="cart-count">{cart.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <main className="shop-main">
        <p className="shop-count">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280', fontSize: '1rem' }}>
            Loading products…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            <span style={{ fontSize: '2.5rem' }}>🛍️</span>
            <p style={{ marginTop: '12px' }}>No products found.</p>
          </div>
        ) : (
          <div className={`product-grid ${!gridView ? 'product-list-layout' : ''}`}>
            {filteredProducts.map((product, index) => {
              const badge = getBadge(index);
              const { rating, reviews } = getRating(index);
              const emoji = EMOJI_MAP[product.category] || '🎁';
              const isLiked = liked[product.id];

              return (
                <div className="product-card" key={product.id}>
                  {/* Image / Placeholder */}
                  <div className="product-card-img-wrapper">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="product-card-img"
                      />
                    ) : (
                      <div className="product-card-placeholder">
                        <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
                        <span>{product.category || 'Gift'}</span>
                      </div>
                    )}

                    {badge && (
                      <span className={`product-badge ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}

                    <button
                      className={`product-wishlist-btn ${isLiked ? 'liked' : ''}`}
                      onClick={() => toggleLike(product.id)}
                      aria-label="Add to wishlist"
                    >
                      <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} stroke={isLiked ? '#ef4444' : '#6b7280'} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="product-card-body">
                    <h3 className="product-card-name">{product.name}</h3>
                    <p className="product-card-desc">
                      {product.description ||
                        `${product.category || 'Gift Shop'} item — a perfect wildlife-inspired keepsake.`}
                    </p>

                    {/* Rating */}
                    <div className="product-rating">
                      <Star className="star" size={13} fill="#f59e0b" stroke="none" />
                      <strong>{rating}</strong>
                      <span className="reviews">({reviews} reviews)</span>
                    </div>

                    {/* Price + Add */}
                    <div className="product-card-footer">
                      <div className="product-prices">
                        <span className="product-price">
                          ${Number(product.price || 0).toFixed(2)}
                        </span>
                        {badge?.label === 'Sale' && (
                          <span className="product-price-original">
                            ${(Number(product.price || 0) * 1.2).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        className="product-add-btn"
                        onClick={() => handleAdd(product)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Toast */}
      {toast && <div className="cart-toast">🛒 {toast}</div>}

      {/* ── Cart Side Panel ── */}
      <div className={`cart-backdrop ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-side-panel ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Shopping Cart ({cart.length})</h2>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>×</button>
        </div>
        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={54} strokeWidth={1.5} />
              <h3>Your cart is empty</h3>
              <p>Add some items to get started!</p>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item, i) => (
                 <div key={i} className="cart-item">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="cart-item-placeholder">{EMOJI_MAP[item.category] || '🎁'}</div>
                    )}
                    <div className="cart-item-details">
                       <h4>{item.name}</h4>
                       <span>${Number(item.price || 0).toFixed(2)}</span>
                    </div>
                 </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
           <div className="cart-footer">
              <button className="cart-checkout-btn">Checkout</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
