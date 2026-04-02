import { useEffect, useState, useMemo } from 'react';
import { getAllProducts } from '../../../services/productService';
import { API_BASE_URL } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../services/firebase';
import giftShopHeroImg from '../../../assets/images/zoo-giftshop.jpg';
import './ProductPage.css';
import { Search, ShoppingCart, Plus, Minus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import CheckoutModal from './CheckoutModal';

const EMOJI_MAP = {
  'Plush Toys & Stuffed Animals': '🧸',
  'Apparel & Wearables': '👕',
  'Souvenirs & Memorabilia': '🏆',
  'Books & Educational Items': '📚',
  'Toys & Games': '🎮',
  'Home & Decor': '🏠',
  'Jewelry & Accessories': '💎',
  'Art & Collectibles': '🎨',
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Generic mock components
const Button = ({ children, variant = 'default', size = 'default', className, ...props }) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-secondary hover:text-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md text-sm",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
};


const Badge = ({ children, variant = "default", className }) => {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground",
  };
  return <span className={cn(base, variants[variant], className)}>{children}</span>;
}

function enrichProduct(product) {
  return {
    ...product,
    image: product.imageUrl ? `${API_BASE_URL}${product.imageUrl}` : '',
    inStock: (product.stockQuantity || 0) > 0,
  };
}

const ProductPage = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [viewMode] = useState("grid");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryPage, setCategoryPage] = useState(0);
  const [catAnimKey, setCatAnimKey] = useState(0);
  const [catAnimDir, setCatAnimDir] = useState('right');
  const [membershipDiscount, setMembershipDiscount] = useState(0);
  const CAT_PAGE_SIZE = 3;

  // Fetch the logged-in user's active membership discount
  useEffect(() => {
    if (!currentUser) { setMembershipDiscount(0); return; }
    (async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/membership-subscriptions/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMembershipDiscount(data.active ? (data.giftShopDiscount || 0) : 0);
      } catch {
        setMembershipDiscount(0);
      }
    })();
  }, [currentUser]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProducts();
        setProducts(Array.isArray(data) && data.length ? data.map(p => enrichProduct(p)) : []);
      } catch (error) {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    return [{ id: 'All Products', label: 'All Products' }, ...unique.map(c => ({ id: c, label: c }))];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Products" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const maxStock = product.stockQuantity || 0;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= maxStock) {
          toast.error(`Only ${maxStock} in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price || 0), quantity: 1, image: product.image, category: product.category, stockQuantity: maxStock }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;
          const newQty = Math.max(0, item.quantity + delta);
          if (delta > 0 && item.quantity >= (item.stockQuantity || Infinity)) {
            toast.error(`Only ${item.stockQuantity} in stock.`);
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="giftshop-hero-frame relative flex items-center justify-center overflow-hidden">

        <img
          src={giftShopHeroImg}
          alt="Zoo Gift Shop"
            className="giftshop-hero-img absolute inset-0 w-full h-full"/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgb(30, 29, 29) 100%)' }} />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance m-0 tracking-tight">
            Gift Shop
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-pretty">
            Take home a piece of the wild. Browse our collection of plush toys, apparel, and unique souvenirs.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="sticky top-[4rem] z-40 bg-card border-b border-border" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* LEFT: Search */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-full min-w-0 md:min-w-[336px] md:max-w-[480px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ width: '1.125rem', height: '1.125rem' }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  style={{
                    height: '2.75rem',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    fontSize: '0.9375rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* RIGHT: Category Carousel + Cart (always visible) */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Prev arrow */}
              <button
                onClick={() => { setCategoryPage(p => p - 1); setCatAnimDir('left'); setCatAnimKey(k => k + 1); }}
                disabled={categoryPage === 0}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground cursor-pointer hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-default shrink-0"
                style={{ height: '2.25rem', width: '2.25rem' }}
              >
                <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
              </button>

              {/* 3 visible categories */}
              <div key={catAnimKey} className={`ps-cat-filters ps-slide-${catAnimDir}`}>
                {categories
                  .slice(categoryPage * CAT_PAGE_SIZE, categoryPage * CAT_PAGE_SIZE + CAT_PAGE_SIZE)
                  .map((category) => (
                    <button
                      key={category.id}
                      className={cn(
                        "inline-flex whitespace-nowrap items-center shrink-0 rounded-lg border cursor-pointer transition-all text-sm font-medium",
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-secondary"
                      )}
                      style={{ height: '2.25rem', padding: '0 0.875rem' }}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
              </div>

              {/* Next arrow */}
              <button
                onClick={() => { setCategoryPage(p => p + 1); setCatAnimDir('right'); setCatAnimKey(k => k + 1); }}
                disabled={categoryPage >= Math.ceil(categories.length / CAT_PAGE_SIZE) - 1}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground cursor-pointer hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-default shrink-0"
                style={{ height: '2.25rem', width: '2.25rem' }}
              >
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
              </button>

              {/* Cart — always visible, outside carousel */}
              <button
                className="relative inline-flex items-center justify-center rounded-xl border border-border bg-background text-foreground cursor-pointer hover:bg-secondary transition-colors shrink-0"
                style={{ height: '2.75rem', width: '2.75rem' }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart style={{ width: '1.125rem', height: '1.125rem' }} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full shadow-sm font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12 lg:px-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground m-0">
            Showing <span className="font-medium text-foreground">{filteredProducts.length}</span> products
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-32 text-muted-foreground">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold m-0">No products found</h3>
            <p className="text-muted-foreground mt-1 mb-0">Try adjusting your category or search.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const emoji = EMOJI_MAP[product.category] || '🎁';
              return (
              <div
                key={product.id}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-muted border-b border-border">
                  {product.image && !product.image.includes('undefined') ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={!product.inStock ? { filter: 'blur(3px) brightness(0.45)' } : {}}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30"
                      style={!product.inStock ? { filter: 'blur(3px) brightness(0.45)' } : {}}>
                        <span className="text-6xl drop-shadow-sm">{emoji}</span>
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{
                        background: 'rgba(55,55,55,0.88)',
                        color: '#d1d5db',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '0.45rem 1.5rem',
                        borderRadius: 4,
                        border: '1px solid rgba(180,180,180,0.35)',
                        transform: 'rotate(-8deg)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}>Out of Stock</span>
                    </div>
                  )}
                  {product.inStock && product.stockQuantity <= (product.lowStockThreshold || 10) && (
                    <div className="absolute top-2 left-2">
                      <span style={{
                        background: 'rgba(234,88,12,0.92)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        padding: '3px 8px',
                        borderRadius: 5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }}>Only {product.stockQuantity} left</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1 tracking-tight">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{product.category}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">${Number(product.price || 0).toFixed(2)}</span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!product.inStock}
                      onClick={() => addToCart(product)}
                      className="h-8 rounded-md"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredProducts.map((product) => {
              const emoji = EMOJI_MAP[product.category] || '🎁';
              return (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row gap-5 bg-card rounded-2xl border border-border p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div className="relative w-full sm:w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-border/50">
                  {product.image && !product.image.includes('undefined') ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30">
                        <span className="text-5xl drop-shadow-sm">{emoji}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div>
                      <h3 className="font-semibold text-xl text-foreground tracking-tight m-0">{product.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 m-0">{product.category}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4 sm:mt-0 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">${Number(product.price || 0).toFixed(2)}</span>
                    </div>
                    <Button disabled={!product.inStock} onClick={() => addToCart(product)} className="h-10 px-6">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </section>

      {/* Cart Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Cart Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[400px] max-w-md bg-background border-l border-border z-[100] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold m-0 tracking-tight">Your Cart</h2>
              <Badge variant="secondary" className="ml-2 font-mono border-none">{cartCount}</Badge>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-muted rounded-full cursor-pointer border-none bg-transparent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-32">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-5">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-semibold text-foreground m-0">Your cart is empty</p>
              <p className="text-muted-foreground mt-2 max-w-[200px]">Add some wild souvenirs to get started!</p>
              <Button variant="outline" className="mt-6" onClick={() => setIsCartOpen(false)}>Continue Shopping</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.map((item) => {
                const emoji = EMOJI_MAP[item.category] || '🎁';
                return (
                <div key={item.id} className="flex gap-4 p-3 bg-card border border-border shadow-sm rounded-xl relative group">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center text-3xl">
                    {item.image && !item.image.includes('undefined') ? (
                        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        emoji
                    )}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 pr-6">
                    <h4 className="font-semibold text-foreground text-sm line-clamp-2 m-0 mt-1 leading-snug">{item.name}</h4>
                    <p className="text-foreground font-bold text-sm mt-1 m-0">${item.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <div className="flex items-center border border-border rounded-md bg-background">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1.5 hover:bg-muted text-muted-foreground transition-colors border-none bg-transparent cursor-pointer rounded-l-md"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.quantity >= (item.stockQuantity || Infinity)}
                            className="p-1.5 hover:bg-muted text-muted-foreground transition-colors border-none bg-transparent cursor-pointer rounded-r-md disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                    title="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )})}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-5 border-t border-border bg-card absolute bottom-0 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base text-muted-foreground font-medium">Subtotal</span>
              <span className="text-2xl font-bold text-foreground">${cartTotal.toFixed(2)}</span>
            </div>
            <Button className="w-full h-12 text-base font-semibold shadow-md" size="lg" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>
              Proceed to Checkout
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3 uppercase tracking-wider font-semibold">
              Taxes and Shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    <CheckoutModal
      isOpen={isCheckoutOpen}
      onClose={() => setIsCheckoutOpen(false)}
      cart={cart}
      cartTotal={cartTotal}
      membershipDiscount={membershipDiscount}
      onOrderPlaced={() => setCart([])}
    />
    </div>
  );
};

export default ProductPage;
