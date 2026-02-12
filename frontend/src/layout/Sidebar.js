import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => (
  <div className="sidebar">
    <h2>Zootabase</h2>
    <nav>
      <ul>
        <li><Link to="/animals">Animals</Link></li>
        <li><Link to="/attractions">Attractions</Link></li>
        <li><Link to="/staff">Staff</Link></li>
        <li><Link to="/customers">Customers</Link></li>
        <li><Link to="/tickets">Tickets</Link></li>
        <li><Link to="/products">Products</Link></li>
        <li><Link to="/transactions">Transactions</Link></li>
      </ul>
    </nav>
  </div>
);

export default Sidebar;
