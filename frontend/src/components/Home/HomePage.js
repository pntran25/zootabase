import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import lionImage from '../../assets/images/lion.jpg';
import tigerImage from '../../assets/images/tiger.jpg';
import giraffeImage from '../../assets/images/giraffe.jpg';
import pandaImage from '../../assets/images/panda.jpg';
import capyImage from '../../assets/images/capy.jpg';
import redPandaImage from '../../assets/images/redpanda.jpg';

const heroSlides = [
  {
    title: 'Welcome to Zootabase',
    description: 'Over the coming weeks Zootabase will bring keeper talks, animal feeds, and live habitat moments.',
    cta: 'Tune In Now',
    to: '/ticketing',
    image: tigerImage,
  },
  {
    title: 'Meet the Big Cats',
    description: 'Step into our savanna and jungle zones to see lions and tigers up close.',
    cta: 'Explore Attractions',
    to: '/attractions',
    image: lionImage,
  },
  {
    title: 'Plan a Wild Day',
    description: 'Book tickets, discover encounter times, and prepare your perfect zoo visit.',
    cta: 'Book Tickets',
    to: '/tickets',
    image: giraffeImage,
  },
  {
    title: 'Zootabase Gift Shop',
    description: 'Take home animal-inspired keepsakes and exclusive zoo merch.',
    cta: 'Shop Now',
    to: '/products',
    image: pandaImage,
  },
  {
    title: 'Family Friendly Trails',
    description: 'Discover relaxing trails, playful viewing spots, and hidden habitats.',
    cta: 'See Highlights',
    to: '/attractions',
    image: capyImage,
  },
  {
    title: 'Discover Rare Species',
    description: 'From red pandas to rainforest birds, enjoy unique encounters across the park.',
    cta: 'View Exhibits',
    to: '/attractions',
    image: redPandaImage,
  },
];

const featuredExhibits = [
  {
    name: 'Giraffe Encounter',
    description: 'Hand-feed towering giraffes from our raised platform. A family favorite.',
    status: 'OPEN',
    hours: '10am – 4pm',
  },
  {
    name: 'Tropical Rainforest',
    description: 'Walk through a lush canopy with exotic birds and rare amphibians.',
    status: 'OPEN',
    hours: 'All day',
  },
  {
    name: 'Polar Tundra',
    description: 'Habitat upgrades in progress. Reopening in the spring season.',
    status: 'CLOSED',
    hours: 'Reopening soon',
  },
  {
    name: 'Ocean Discovery',
    description: 'See dolphins and reef species in our immersive deep-ocean gallery.',
    status: 'OPEN',
    hours: '9am – 5pm',
  },
];

const HomePage = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => {
        setPreviousSlide(current);
        return (current + 1) % heroSlides.length;
      });
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = heroSlides[activeSlide];

  return (
    <main className="zoo-page">
      <section className="home-hero">
        {heroSlides.map((slide, index) => {
          const isActive = index === activeSlide;
          const isPrevious = index === previousSlide;

          return (
            <div
              key={slide.title}
              className={`home-hero-slide ${isActive ? 'active' : ''} ${isPrevious ? 'previous' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          );
        })}
        <div className="home-hero-fade" aria-hidden />

        <div className="home-hero-content" key={activeSlide}>
          <h2>{currentSlide.title}</h2>
          <p>{currentSlide.description}</p>
          <Link to={currentSlide.to} className="home-featured-cta">{currentSlide.cta}</Link>
        </div>

        <div className="home-hero-dots" aria-label="Hero slide navigation">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={`home-dot ${index === activeSlide ? 'active' : ''}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="home-featured">
        <div>
          <div className="home-featured-title">Taronga-style Wildlife Stream</div>
          <p>Watch live habitat moments, keeper talks, and behind-the-scenes stories.</p>
          <Link to="/ticketing" className="home-featured-cta">Tune In Now</Link>
        </div>
        <span className="home-pill">LIVE</span>
      </section>

      <section className="home-tabs" aria-label="Quick access tabs">
        <Link className="home-tab active" to="/">Visit</Link>
        <Link className="home-tab" to="/attractions">Attractions</Link>
        <Link className="home-tab" to="/products">Shop</Link>
        <Link className="home-tab" to="/ticketing">Tickets</Link>
      </section>

      <section className="zoo-grid">
        {featuredExhibits.map((item) => (
          <article key={item.name} className="home-exhibit-card">
            <div className="home-exhibit-head">
              <span className={`zoo-badge ${item.status === 'CLOSED' ? 'closed' : ''}`}>{item.status}</span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="home-exhibit-foot">◷ {item.hours}</div>
          </article>
        ))}
      </section>

      <section className="home-shortcuts zoo-card">
        <h3>Plan Your Day</h3>
        <p>Everything you need for your visit, all in one place.</p>
        <div className="zoo-actions">
          <Link className="zoo-btn zoo-link" to="/attractions">Explore Attractions</Link>
          <Link className="zoo-btn secondary zoo-link" to="/products">Visit Gift Shop</Link>
          <Link className="zoo-btn zoo-link" to="/ticketing">Book Tickets</Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
