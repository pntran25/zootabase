"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ShoppingCart, Heart, Star, Filter, Grid3X3, List, Plus, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All Products" },
  { id: "plush", label: "Plush Toys" },
  { id: "apparel", label: "Apparel" },
  { id: "accessories", label: "Accessories" },
  { id: "toys", label: "Toys & Games" },
  { id: "home", label: "Home & Decor" },
  { id: "books", label: "Books" },
]

const products = [
  {
    id: 1,
    name: "Lion Plush Toy",
    category: "plush",
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.8,
    reviews: 156,
    image: "/images/lion.jpg",
    badge: "Best Seller",
    description: "Soft and cuddly lion plush, perfect for all ages.",
    inStock: true,
  },
  {
    id: 2,
    name: "Elephant Plush Toy",
    category: "plush",
    price: 22.99,
    rating: 4.9,
    reviews: 203,
    image: "/images/elephant.jpg",
    badge: "New",
    description: "Adorable elephant with realistic details.",
    inStock: true,
  },
  {
    id: 3,
    name: "Wildwood Zoo T-Shirt",
    category: "apparel",
    price: 28.99,
    rating: 4.7,
    reviews: 89,
    image: "/images/tiger.jpg",
    description: "100% cotton tee with zoo logo.",
    inStock: true,
  },
  {
    id: 4,
    name: "Tiger Plush Toy",
    category: "plush",
    price: 26.99,
    rating: 4.8,
    reviews: 134,
    image: "/images/tiger.jpg",
    badge: "Popular",
    description: "Majestic tiger plush with soft fur.",
    inStock: true,
  },
  {
    id: 5,
    name: "Penguin Backpack",
    category: "accessories",
    price: 34.99,
    rating: 4.6,
    reviews: 67,
    image: "/images/penguin.jpg",
    description: "Fun penguin-shaped backpack for kids.",
    inStock: true,
  },
  {
    id: 6,
    name: "Gorilla Action Figure",
    category: "toys",
    price: 18.99,
    rating: 4.5,
    reviews: 45,
    image: "/images/gorilla.jpg",
    description: "Poseable gorilla figure with realistic details.",
    inStock: true,
  },
  {
    id: 7,
    name: "Giraffe Water Bottle",
    category: "accessories",
    price: 19.99,
    originalPrice: 24.99,
    rating: 4.7,
    reviews: 112,
    image: "/images/giraffe.jpg",
    badge: "Sale",
    description: "Stainless steel bottle with giraffe print.",
    inStock: true,
  },
  {
    id: 8,
    name: "Safari Animal Puzzle",
    category: "toys",
    price: 16.99,
    rating: 4.8,
    reviews: 78,
    image: "/images/hero-wildlife.jpg",
    description: "500-piece puzzle featuring safari animals.",
    inStock: false,
  },
  {
    id: 9,
    name: "Red Panda Hoodie",
    category: "apparel",
    price: 49.99,
    rating: 4.9,
    reviews: 56,
    image: "/images/red-panda.jpg",
    badge: "New",
    description: "Cozy hoodie with cute red panda design.",
    inStock: true,
  },
  {
    id: 10,
    name: "Wildlife Photography Book",
    category: "books",
    price: 39.99,
    rating: 4.9,
    reviews: 234,
    image: "/images/snow-leopard.jpg",
    badge: "Staff Pick",
    description: "Stunning collection of wildlife photography.",
    inStock: true,
  },
  {
    id: 11,
    name: "Flamingo Mug",
    category: "home",
    price: 14.99,
    rating: 4.6,
    reviews: 92,
    image: "/images/flamingo.jpg",
    description: "Ceramic mug with pink flamingo design.",
    inStock: true,
  },
  {
    id: 12,
    name: "Sea Lion Plush",
    category: "plush",
    price: 21.99,
    rating: 4.7,
    reviews: 67,
    image: "/images/sea-lion.jpg",
    description: "Playful sea lion plush toy.",
    inStock: true,
  },
]

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

export default function GiftShopPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [wishlist, setWishlist] = useState<number[]>([])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/gift-shop-hero.jpg"
          alt="Zoo Gift Shop"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Badge className="mb-4 bg-accent text-accent-foreground">Shop Online</Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance">
            Gift Shop
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Take home a piece of the wild. Browse our collection of plush toys, apparel, and unique souvenirs.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* View Toggle & Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="outline"
                className="relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                      {product.badge}
                    </Badge>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary">Out of Stock</Badge>
                    </div>
                  )}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-colors",
                        wishlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
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
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex gap-6 bg-card rounded-2xl border border-border p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.badge && (
                    <Badge className="absolute top-2 left-2 text-xs bg-accent text-accent-foreground">
                      {product.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                      <button onClick={() => toggleWishlist(product.id)}>
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-colors",
                            wishlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-muted-foreground mt-1">{product.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-foreground">${product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-muted-foreground line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button disabled={!product.inStock} onClick={() => addToCart(product)}>
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Shopping Cart ({cartCount})</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">Your cart is empty</p>
                  <p className="text-muted-foreground mt-1">Add some items to get started!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-muted/50 rounded-xl">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-primary font-semibold">${item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded-md bg-background border border-border hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded-md bg-background border border-border hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto p-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-foreground">${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg">
                  Checkout
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Shipping calculated at checkout
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
