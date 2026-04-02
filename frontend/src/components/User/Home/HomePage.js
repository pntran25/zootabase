import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { getExhibits } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';

// Fallback images
import lionImage from '../../../assets/images/cheetah-4k.jpg';
import placeholderImg from '../../../assets/images/Exhibits_Images/ExhibitsComingSoon.png';

// Inline simple SVG icons to replicate lucide-react visuals without modifying dependencies
const PlayIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ArrowDownIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ width: '1.25rem', height: '1.25rem' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
const ClockIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MapPinIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TicketIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const UsersIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const HeartIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const SparklesIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const CalendarIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ShieldIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const GlobeIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LeafIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

const HomePage = () => {
  const [exhibits, setExhibits] = useState([]);

  useEffect(() => {
    const fetchExhibits = async () => {
      try {
        const data = await getExhibits();
        setExhibits(data);
      } catch (err) {
        console.error('Failed to fetch exhibits:', err);
      }
    };
    fetchExhibits();
  }, []);

  // Featured exhibits first, then fill to 8 with the rest
  const displayExhibits = [
    ...exhibits.filter(e => e.IsFeatured === true || e.IsFeatured === 1),
    ...exhibits.filter(e => e.IsFeatured !== true && e.IsFeatured !== 1),
  ].slice(0, 8);

  return (
    <main className="ww-home">
      {/* ═══ HERO ═══ */}
      <section className="ww-hero">
        <div className="ww-hero-bg">
          <img src={lionImage} alt="Wildlife at Zootabase Zoo" />
        </div>
        <div className="ww-hero-overlay-1" />
        <div className="ww-hero-overlay-2" />
        
        <div className="ww-hero-content">
          <div className="ww-hero-inner">
            <span className="ww-hero-badge">Open Daily 9AM – 6PM</span>
            
            <h1 className="ww-hero-heading">
              <span className="ww-hero-heading-block">Experience the</span>
              <span className="ww-hero-heading-accent">Wild</span>
            </h1>
            
            <p className="ww-hero-sub">
              Journey through immersive habitats and connect with over 500
              species from around the world. Conservation, education, and
              adventure await.
            </p>
            
            <div className="ww-hero-ctas">
              <Link to="/ticketing" className="ww-btn ww-btn-primary">Plan Your Visit</Link>
              <button className="ww-btn ww-btn-outline" type="button">
                <PlayIcon /> Watch Video
              </button>
            </div>
            
            <div className="ww-hero-stats">
              <div>
                <p className="ww-hero-stat-value">500+</p>
                <p className="ww-hero-stat-label">Animal Species</p>
              </div>
              <div>
                <p className="ww-hero-stat-value">200</p>
                <p className="ww-hero-stat-label">Acres of Habitat</p>
              </div>
              <div>
                <p className="ww-hero-stat-value">1M+</p>
                <p className="ww-hero-stat-label">Annual Visitors</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ww-hero-scroll">
          <button
            className="ww-scroll-btn"
            aria-label="Scroll to exhibits"
            onClick={() => document.getElementById('exhibits')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ArrowDownIcon />
          </button>
        </div>
      </section>

      {/* ═══ QUICK INFO ═══ */}
      <section className="ww-info-section">
        <div className="ww-info-container">
          <div className="ww-info-grid">
            <div className="ww-info-item">
              <div className="ww-info-icon-wrap"><ClockIcon /></div>
              <div>
                <p className="ww-info-label">Hours Today</p>
                <p className="ww-info-value">9:00 AM - 6:00 PM</p>
              </div>
            </div>
            <div className="ww-info-item">
              <div className="ww-info-icon-wrap"><MapPinIcon /></div>
              <div>
                <p className="ww-info-label">Location</p>
                <p className="ww-info-value">123 Wildlife Way</p>
              </div>
            </div>
            <div className="ww-info-item">
              <div className="ww-info-icon-wrap"><TicketIcon /></div>
              <div>
                <p className="ww-info-label">Adult Tickets</p>
                <p className="ww-info-value">From $29.99</p>
              </div>
            </div>
            <div className="ww-info-item">
              <div className="ww-info-icon-wrap"><UsersIcon /></div>
              <div>
                <p className="ww-info-label">Visitors Today</p>
                <p className="ww-info-value">2,847</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED EXHIBITS ═══ */}
      <section id="exhibits" className="ww-exhibits-section">
        <div className="ww-container">
          <div className="ww-section-header">
            <span className="ww-eyebrow">Explore Our World</span>
            <h2 className="ww-heading">Featured Exhibits</h2>
            <p className="ww-sub">
              Discover incredible animals from every corner of the globe in our thoughtfully designed habitats that prioritize animal welfare and visitor education.
            </p>
          </div>

          {displayExhibits.length > 0 ? (
            <div className="ww-bento">
              {displayExhibits.map((exhibit, idx) => {
                const isBig = idx === 0 || idx === 5;
                const imgSrc = exhibit.ImageUrl
                  ? `${API_BASE_URL}${exhibit.ImageUrl}`
                  : placeholderImg;

                return (
                  <Link 
                    to="/exhibits" 
                    key={exhibit.ExhibitID}
                    className={`ww-card ${isBig ? 'ww-card-big' : 'ww-card-sm'}`}
                    style={{ gridArea: `tile${idx + 1}` }}
                  >
                    <div className="ww-card-img">
                      <img src={imgSrc} alt={exhibit.ExhibitName} />
                      <div className="ww-card-overlay" />
                    </div>
                    <div className="ww-card-content">
                      <div className="ww-badges">
                        {exhibit.AreaName && (
                          <span className="ww-badge-item">
                            <MapPinIcon /> {exhibit.AreaName}
                          </span>
                        )}
                        <span className="ww-badge-item">
                          <ClockIcon /> {exhibit.OpeningHours || '9AM - 5PM'}
                        </span>
                      </div>
                      <h3 className="ww-card-title">{exhibit.ExhibitName}</h3>
                      <p className="ww-card-desc">
                        {exhibit.HabitatType
                            ? `Experience the ${exhibit.HabitatType.toLowerCase()} habitat, home to amazing wildlife.`
                            : 'Experience one of our beautiful animal habitats.'}
                      </p>
                      <span className="ww-card-cta">Explore Exhibit &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '40px 0' }}>
              Loading exhibits…
            </p>
          )}

          <div className="ww-view-all">
            <Link to="/exhibits" className="ww-view-all-link">
              View All {exhibits.length > 0 ? exhibits.length : ''} Exhibits
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '1.25rem', height: '1.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ EXPERIENCES ═══ */}
      <section className="ww-exp-section">
        <div className="ww-container">
          <div className="ww-exp-grid">
            <div>
              <span className="ww-eyebrow">Unforgettable Moments</span>
              <h2 className="ww-heading">More Than Just a Visit</h2>
              <p className="ww-sub">
                Create lasting memories with immersive experiences that bring you closer to the animal kingdom than ever before.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/attractions" className="ww-btn ww-btn-primary">Explore All Experiences</Link>
              </div>
            </div>

            <div className="ww-exp-cards">
              <div className="ww-exp-card">
                <div className="ww-exp-icon"><HeartIcon /></div>
                <h3 className="ww-exp-title">Animal Encounters</h3>
                <p className="ww-exp-desc">Get up close with your favorite animals in our guided encounter experiences. Feed giraffes, meet penguins, and more.</p>
                <button className="ww-exp-cta">Book Now &rarr;</button>
              </div>
              <div className="ww-exp-card">
                <div className="ww-exp-icon"><UsersIcon /></div>
                <h3 className="ww-exp-title">Behind the Scenes</h3>
                <p className="ww-exp-desc">Go where most visitors can't. Learn about animal care, nutrition, and conservation from our expert keepers.</p>
                <button className="ww-exp-cta">Learn More &rarr;</button>
              </div>
              <div className="ww-exp-card">
                <div className="ww-exp-icon"><CalendarIcon /></div>
                <h3 className="ww-exp-title">Daily Programs</h3>
                <p className="ww-exp-desc">Join us for feeding times, keeper talks, and educational presentations happening throughout the day.</p>
                <button className="ww-exp-cta">See Schedule &rarr;</button>
              </div>
              <div className="ww-exp-card">
                <div className="ww-exp-icon"><SparklesIcon /></div>
                <h3 className="ww-exp-title">Special Events</h3>
                <p className="ww-exp-desc">From night safaris to seasonal celebrations, discover unique ways to experience the zoo after hours.</p>
                <button className="ww-exp-cta">View Events &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONSERVATION ═══ */}
      <section className="ww-con-section">
        <div className="ww-container">
          <div className="ww-con-header">
            <span className="ww-eyebrow ww-con-eyebrow">Making a Difference</span>
            <h2 className="ww-heading ww-con-heading">Conservation at Our Core</h2>
            <p className="ww-sub ww-con-sub">
              Every visit supports our mission to protect wildlife and preserve habitats for future generations.
            </p>
          </div>

          <div className="ww-con-stats">
            <div className="ww-con-stat">
              <p className="ww-con-stat-val">47</p>
              <p className="ww-con-stat-label">Conservation Projects</p>
            </div>
            <div className="ww-con-stat">
              <p className="ww-con-stat-val">$12M+</p>
              <p className="ww-con-stat-label">Funds Raised</p>
            </div>
            <div className="ww-con-stat">
              <p className="ww-con-stat-val">18</p>
              <p className="ww-con-stat-label">Species Protected</p>
            </div>
          </div>

          <div className="ww-con-cards">
            <div className="ww-con-card">
              <div className="ww-con-icon"><ShieldIcon /></div>
              <h3 className="ww-con-title">Species Protection</h3>
              <p className="ww-con-desc">Active breeding programs for endangered species including snow leopards and red pandas.</p>
            </div>
            <div className="ww-con-card">
              <div className="ww-con-icon"><GlobeIcon /></div>
              <h3 className="ww-con-title">Global Partnerships</h3>
              <p className="ww-con-desc">Working with conservation organizations in 23 countries to protect wildlife habitats.</p>
            </div>
            <div className="ww-con-card">
              <div className="ww-con-icon"><LeafIcon /></div>
              <h3 className="ww-con-title">Sustainability</h3>
              <p className="ww-con-desc">Carbon-neutral operations and 100% renewable energy powering all zoo facilities.</p>
            </div>
          </div>

          <div className="ww-con-cta-wrap">
            <Link to="/exhibits" className="ww-btn ww-btn-secondary">Support Our Mission</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
