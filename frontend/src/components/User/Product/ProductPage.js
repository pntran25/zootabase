// Product main page component
import React, { useEffect, useState } from 'react';
import { getProducts } from '../../../services/productService';

const fallbackProducts = [
  { id: 1, name: 'Safari Hat', category: 'Apparel', price: '$24.99', stock: 54 },
  { id: 2, name: 'Plush Penguin', category: 'Toys', price: '$18.50', stock: 71 },
  { id: 3, name: 'Zoo Water Bottle', category: 'Accessories', price: '$14.00', stock: 120 },
];

const ProductPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(Array.isArray(data) && data.length ? data : fallbackProducts);
      } catch (error) {
        setProducts(fallbackProducts);
      }
    };

    loadProducts();
  }, []);

  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">Shop</h1>
      <p className="zoo-page-subtitle">Discover visitor favorites, keepsakes, and wildlife-inspired gifts.</p>

      <div className="zoo-grid">
        {products.map((product) => (
          <article key={product.id || product.name} className="zoo-card">
            <h3>{product.name}</h3>
            <p>Category: {product.category || 'General'}</p>
            <p>Price: {product.price || `$${Number(product.unitPrice || 0).toFixed(2)}`}</p>
            <p>In Stock: {product.stock ?? product.inventory ?? 'N/A'}</p>
          </article>
        ))}
      </div>
    </main>
  );
};

export default ProductPage;
