import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { getExhibits } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';
import lionImage from '../../../assets/images/HomePage.png';
import placeholderImg from '../../../assets/images/Exhibits_Images/ExhibitsComingSoon.png';

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

  // First 5 exhibits for the featured grid
  const displayExhibits = exhibits.slice(0, 5);

  return (
    <main className="ww-home">
      {/* ═══ HERO ═══ */}
      <section className="ww-hero" style={{ backgroundImage: `url(${lionImage})` }}>
        <div className="ww-hero-overlay" />
        <div className="ww-hero-content">
          <span className="ww-hero-badge">Open Daily 9AM – 6PM</span>
          <h1 className="ww-hero-heading">
            Experience the<br /><span className="ww-accent">Wild</span>
          </h1>
          <p className="ww-hero-sub">
            Journey through immersive habitats and connect with over 500
            species from around the world. Conservation, education, and
            adventure await.
          </p>
          <div className="ww-hero-ctas">
            <Link to="/ticketing" className="ww-cta-primary">Plan Your Visit</Link>
            <button className="ww-cta-secondary" type="button">▷ Watch Video</button>
          </div>
          <div className="ww-hero-stats">
            <div className="ww-stat">
              <span className="ww-stat-num">500+</span>
              <span className="ww-stat-label">Animal Species</span>
            </div>
            <div className="ww-stat">
              <span className="ww-stat-num">200</span>
              <span className="ww-stat-label">Acres of Habitat</span>
            </div>
            <div className="ww-stat">
              <span className="ww-stat-num">1M+</span>
              <span className="ww-stat-label">Annual Visitors</span>
            </div>
          </div>
        </div>
        <div className="ww-hero-scroll">
          <span className="ww-scroll-arrow">↓</span>
        </div>
      </section>

      {/* ═══ INFO BAR ═══ */}
      <section className="ww-info-bar">
        <div className="ww-info-item">
          <span className="ww-info-icon">🕐</span>
          <div>
            <div className="ww-info-label">Hours Today</div>
            <div className="ww-info-value">9:00 AM – 6:00 PM</div>
          </div>
        </div>
        <div className="ww-info-item">
          <span className="ww-info-icon">📍</span>
          <div>
            <div className="ww-info-label">Location</div>
            <div className="ww-info-value">123 Wildlife Way</div>
          </div>
        </div>
        <div className="ww-info-item">
          <span className="ww-info-icon">🎟</span>
          <div>
            <div className="ww-info-label">Adult Tickets</div>
            <div className="ww-info-value">From <strong>$29.99</strong></div>
          </div>
        </div>
        <div className="ww-info-item">
          <span className="ww-info-icon">👥</span>
          <div>
            <div className="ww-info-label">Visitors Today</div>
            <div className="ww-info-value">2,847</div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED EXHIBITS ═══ */}
      <section className="ww-section ww-exhibits-section">
        <span className="ww-section-eyebrow">Explore Our World</span>
        <h2 className="ww-section-heading">Featured Exhibits</h2>
        <p className="ww-section-sub">
          Discover incredible animals from every corner of the globe in our thoughtfully
          designed habitats that prioritize animal welfare and visitor education.
        </p>

        {displayExhibits.length > 0 ? (
          <div className="ww-exhibit-bento">
            {displayExhibits.map((exhibit, idx) => {
              const isFeatured = exhibit.ExhibitID % 2 === 1;
              const imgSrc = exhibit.ImageUrl
                ? `${API_BASE_URL}${exhibit.ImageUrl}`
                : placeholderImg;

              return (
                <article
                  key={exhibit.ExhibitID}
                  className={`ww-exhibit-card ${isFeatured ? 'featured' : ''}`}
                >
                  <div
                    className="ww-exhibit-img"
                    style={{ backgroundImage: `url(${imgSrc})` }}
                  >
                    <div className="ww-exhibit-overlay">
                      <div className="ww-exhibit-badges">
                        {exhibit.AreaName && (
                          <span className="ww-ebadge">📍 {exhibit.AreaName}</span>
                        )}
                        <span className="ww-ebadge">🕐 {exhibit.OpeningHours || '9AM – 5PM'}</span>
                      </div>
                      <div className="ww-exhibit-info">
                        <h3>{exhibit.ExhibitName}</h3>
                        <p>
                          {exhibit.HabitatType
                            ? `Experience the ${exhibit.HabitatType.toLowerCase()} habitat, home to amazing wildlife.`
                            : 'Experience one of our beautiful animal habitats.'}
                        </p>
                        <Link to="/exhibits" className="ww-exhibit-link">
                          Explore Exhibit →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
            Loading exhibits…
          </p>
        )}

        <div className="ww-exhibits-footer">
          <Link to="/exhibits" className="ww-view-all">
            View All {exhibits.length} Exhibits →
          </Link>
        </div>
      </section>

      {/* ═══ MORE THAN JUST A VISIT ═══ */}
      <section className="ww-section ww-experiences">
        <div className="ww-exp-left">
          <span className="ww-section-eyebrow">Unforgettable Moments</span>
          <h2 className="ww-section-heading">More Than Just a Visit</h2>
          <p className="ww-section-sub">
            Create lasting memories with immersive experiences that bring you
            closer to the animal kingdom than ever before.
          </p>
          <Link to="/attractions" className="ww-cta-primary">Explore All Experiences</Link>
        </div>
        <div className="ww-exp-grid">
          <div className="ww-exp-card">
            <span className="ww-exp-icon">♡</span>
            <h4>Animal Encounters</h4>
            <p>Get up close with your favorite animals in our guided encounter experiences. Feed giraffes, meet penguins, and more.</p>
            <Link to="/attractions" className="ww-exp-link">Book Now →</Link>
          </div>
          <div className="ww-exp-card">
            <span className="ww-exp-icon">🔍</span>
            <h4>Behind the Scenes</h4>
            <p>Go where most visitors can't. Learn about animal care, nutrition, and conservation from our expert keepers.</p>
            <Link to="/attractions" className="ww-exp-link">Learn More →</Link>
          </div>
          <div className="ww-exp-card">
            <span className="ww-exp-icon">📅</span>
            <h4>Daily Programs</h4>
            <p>Join us for feeding times, keeper talks, and educational presentations happening throughout the day.</p>
            <Link to="/attractions" className="ww-exp-link">See Schedule →</Link>
          </div>
          <div className="ww-exp-card">
            <span className="ww-exp-icon">✦</span>
            <h4>Special Events</h4>
            <p>From night safaris to seasonal celebrations, discover unique ways to experience the zoo after hours.</p>
            <Link to="/attractions" className="ww-exp-link">View Events →</Link>
          </div>
        </div>
      </section>

      {/* ═══ CONSERVATION ═══ */}
      <section className="ww-conservation">
        <span className="ww-section-eyebrow ww-eyebrow-light">Making a Difference</span>
        <h2 className="ww-section-heading ww-heading-light">Conservation at Our Core</h2>
        <p className="ww-con-sub">
          Every visit supports our mission to protect wildlife and preserve habitats for future generations.
        </p>

        <div className="ww-con-stats">
          <div className="ww-con-stat">
            <span className="ww-con-num">47</span>
            <span className="ww-con-label">Conservation Projects</span>
          </div>
          <div className="ww-con-stat">
            <span className="ww-con-num">$12M+</span>
            <span className="ww-con-label">Funds Raised</span>
          </div>
          <div className="ww-con-stat">
            <span className="ww-con-num">18</span>
            <span className="ww-con-label">Species Protected</span>
          </div>
        </div>

        <div className="ww-con-cards">
          <div className="ww-con-card">
            <span className="ww-con-card-icon">🛡</span>
            <h4>Species Protection</h4>
            <p>Active breeding programs for endangered species including snow leopards and red pandas.</p>
          </div>
          <div className="ww-con-card">
            <span className="ww-con-card-icon">🌍</span>
            <h4>Global Partnerships</h4>
            <p>Working with conservation organizations in 23 countries to protect wildlife habitats.</p>
          </div>
          <div className="ww-con-card">
            <span className="ww-con-card-icon">🌱</span>
            <h4>Sustainability</h4>
            <p>Carbon-neutral operations and 100% renewable energy powering all zoo facilities.</p>
          </div>
        </div>

        <Link to="/exhibits" className="ww-con-cta">Support Our Mission</Link>
      </section>

    </main>
  );
};

export default HomePage;
