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
            <img src={brandLogo} alt="WildWoods Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
            <span className="ww-footer-logo-text">WildWoods Zoo</span>
          </Link>
          <p className="ww-footer-tagline">
            Connecting people with wildlife and inspiring conservation action since 1985.
          </p>
          <div className="ww-footer-social">
            <a href="#facebook" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#instagram" aria-label="Instagram"><Instagram size={18} /></a>
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
              <li><a href="#getting-here">Getting Here</a></li>
              <li><a href="#accessibility">Accessibility</a></li>
              <li><a href="#map">Zoo Map</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="ww-footer-col">
            <h4>EXPLORE</h4>
            <ul>
              <li><Link to="/exhibits">Exhibits</Link></li>
              <li><Link to="/animals">Animals</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><a href="#dining">Dining</a></li>
              <li><Link to="/products">Gift Shop</Link></li>
            </ul>
          </div>

          <div className="ww-footer-col">
            <h4>SUPPORT</h4>
            <ul>
              <li><Link to="/membership">Membership</Link></li>
              <li><a href="#donate">Donate</a></li>
              <li><a href="#adopt">Adopt an Animal</a></li>
              <li><a href="#volunteer">Volunteer</a></li>
              <li><a href="#corporate">Corporate Partners</a></li>
            </ul>
          </div>

          <div className="ww-footer-col">
            <h4>ABOUT</h4>
            <ul>
              <li><a href="#mission">Our Mission</a></li>
              <li><a href="#conservation">Conservation</a></li>
              <li><a href="#research">Research</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#press">Press</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ww-footer-bottom">
        <p className="ww-footer-copyright">
          © 2026 WildWoods Zoo. All rights reserved.
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
