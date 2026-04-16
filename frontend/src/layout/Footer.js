import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import './Footer.css';
import brandLogo from '../assets/images/Logo.png';

const Footer = () => {
  return (
    <footer className="ww-global-footer">
      <div className="ww-footer-top">
        {/* Brand Column */}
        <div className="ww-footer-brand-col">
          <Link to="/" className="ww-footer-logo">
            <img src={brandLogo} alt="Zootabase Zoo Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
            <span className="ww-footer-logo-text">Zootabase Zoo</span>
          </Link>
          <p className="ww-footer-tagline">
            Connecting people with wildlife and inspiring conservation action since 1985.
          </p>
          <div className="ww-footer-social">
            <a href="#facebook" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="https://www.instagram.com/zootabase.zoo?igsh=a2J1YnJmM3BicmJq&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#twitter" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#youtube" aria-label="Youtube"><Youtube size={18} /></a>
          </div>
        </div>

        {/* Links Columns */}
        <div className="ww-footer-links-grid">
          <div className="ww-footer-col">
            <h4>VISIT</h4>
            <ul>
              <li><Link to="/ticketing">Hours & Admission</Link></li>
              <li><Link to="/ticketing">Buy Tickets</Link></li>
              <li><Link to="/attractions">Attractions</Link></li>
            </ul>
          </div>

          <div className="ww-footer-col">
            <h4>EXPLORE</h4>
            <ul>
              <li><Link to="/exhibits">Exhibits</Link></li>
              <li><Link to="/animals">Animals</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/products">Gift Shop</Link></li>
            </ul>
          </div>

          <div className="ww-footer-col">
            <h4>SUPPORT</h4>
            <ul>
              <li><Link to="/membership">Membership</Link></li>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/signup">Create Account</Link></li>
            </ul>
          </div>

          <div className="ww-footer-col">
            <h4>ABOUT</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/animals">Animals</Link></li>
              <li><Link to="/exhibits">Exhibits</Link></li>
              <li><Link to="/membership">Membership</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ww-footer-bottom">
        <p className="ww-footer-copyright">
          © 2026 Zootabase Zoo. All rights reserved.
        </p>
        <div className="ww-footer-legal">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#cookies">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
