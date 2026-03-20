import React, { useEffect, useState, useCallback } from 'react';
import { getAllProducts } from '../../../services/productService';
import './ProductPage.css';
import { Search, ShoppingCart, Heart, Star, Filter, Grid3X3, List as ListIcon, Plus, Minus, X } from 'lucide-react';

const CATEGORIES = [
  { id: "All Products", label: "All Products" },
  { id: "Gift Shop", label: "Gift Shop" },
  { id: "Food", label: "Food" },
  { id: "Beverage", label: "Beverage" }
];

const EMOJI_MAP = {
  'Gift Shop': '🧸',
  'Food': '🍿',
  'Beverage': '☕',
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

const Input = ({ className, ...props }) => {
  return <input className={cn("flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
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

// Data Enablers
function enrichProduct(product, index) {
  const badges = ['Best Seller', 'New', null, 'Popular', 'Sale', null, 'New', null];
  const ratings = [4.8, 4.9, 4.7, 4.8, 4.6, 4.9, 4.5, 4.7];
  const reviews = [156, 203, 89, 134, 78, 312, 44, 97];
  
  const price = Number(product.price || 0);
  const badge = badges[index % badges.length];

  return {
    ...product,
    image: product.imageUrl ? product.imageUrl : '',
    badge,
    rating: ratings[index % ratings.length],
    reviews: reviews[index % reviews.length],
    inStock: true,
    originalPrice: badge === 'Sale' ? price * 1.2 : null
  };
}

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [viewMode, setViewMode] = useState("grid");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProducts();
        setProducts(Array.isArray(data) && data.length ? data.map(enrichProduct) : []);
      } catch (error) {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Products" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price || 0), quantity: 1, image: product.image, category: product.category }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[360px] flex items-center justify-center overflow-hidden bg-muted">
        <img
          src="https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Zoo Gift Shop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.6)] via-[rgba(0,0,0,0.4)] to-background" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-8">
          <Badge className="mb-4 bg-accent text-accent-foreground border-none">Shop Online</Badge>
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
            {/* LEFT: Search + Filter */}
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
              <button
                className="inline-flex items-center justify-center shrink-0 rounded-xl border border-border bg-background text-foreground cursor-pointer hover:bg-secondary transition-colors"
                style={{
                  height: '2.75rem',
                  width: '2.75rem',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                }}
              >
                <Filter style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* RIGHT: Category Filters + Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.flex.items-center.gap-2.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
                {CATEGORIES.map((category) => (
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
              <Button
                variant="outline"
                className="relative h-10 px-4 shrink-0"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Button>
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
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30">
                        <span className="text-6xl drop-shadow-sm">{emoji}</span>
                    </div>
                  )}
                  {product.badge && (
                    <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-none shadow-sm">
                      {product.badge}
                    </Badge>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                      <Badge variant="secondary" className="border-none shadow-sm">Out of Stock</Badge>
                    </div>
                  )}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors border-none cursor-pointer shadow-sm"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-colors",
                        wishlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1 min-h-[1.5rem] tracking-tight">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {product.description || `${product.category || 'Gift Shop'} item — a perfect wildlife-inspired keepsake.`}
                  </p>
                  <div className="flex items-center gap-2 mb-4 mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">${Number(product.price || 0).toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
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
                  {product.badge && (
                    <Badge className="absolute top-2 left-2 text-[10px] bg-accent text-accent-foreground border-none px-2 shadow-sm">
                      {product.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-xl text-foreground tracking-tight m-0">{product.name}</h3>
                      <button onClick={() => toggleWishlist(product.id)} className="bg-background rounded-full p-2 border-none cursor-pointer hover:bg-muted shadow-sm border border-border">
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-colors",
                            wishlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-2xl m-0">
                      {product.description || `${product.category || 'Gift Shop'} item — a perfect wildlife-inspired keepsake.`}
                    </p>
                    <div className="flex items-center gap-2 mt-3 sm:flex">
                      <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="text-sm font-medium">{product.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 sm:mt-0 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">${Number(product.price || 0).toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-muted-foreground line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
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
                            className="p-1.5 hover:bg-muted text-muted-foreground transition-colors border-none bg-transparent cursor-pointer rounded-r-md"
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
            <Button className="w-full h-12 text-base font-semibold shadow-md" size="lg">
              Proceed to Checkout
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3 uppercase tracking-wider font-semibold">
              Taxes and Shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
