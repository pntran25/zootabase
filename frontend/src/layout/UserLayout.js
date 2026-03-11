import React from 'react';
import { NavLink } from 'react-router-dom';
import './UserLayout.css';

const UserLayout = () => (
  <header className="header">
    <NavLink to="/" className="header-brand-link">
      <div className="header-brand-mark">ZOOTABASE</div>
      <div className="header-brand">For the Wild</div>
    </NavLink>
    <nav className="header-nav" aria-label="Main tabs">
      <NavLink to="/" end className={({ isActive }) => `header-link ${isActive ? 'active' : ''}`}>
        Visit
      </NavLink>
      <NavLink to="/attractions" className={({ isActive }) => `header-link ${isActive ? 'active' : ''}`}>
        Attractions
      </NavLink>
      <NavLink to="/products" className={({ isActive }) => `header-link ${isActive ? 'active' : ''}`}>
        Shop
      </NavLink>
      <NavLink to="/ticketing" className={({ isActive }) => `header-link ${isActive ? 'active' : ''}`}>
        Tickets
      </NavLink>
    </nav>
  </header>
);

export default UserLayout;
