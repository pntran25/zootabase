import React, { useEffect, useState, useCallback } from 'react';
import './EventsPage.css';
import eventService from '../../../services/eventService';
import { Search, Grid, List, MapPin, Calendar, Clock, BookOpen, Star } from 'lucide-react';

const CATEGORIES = ['All Events', 'Family', 'Education', 'Special', 'Seasonal', 'Members Only'];

// Sample animal imagery for placeholder cards (emoji backgrounds)
const CATEGORY_EMOJI = {
  'Family':      '🦒',
  'Education':   '🦁',
  'Special':     '🦁',
  'Seasonal':    '🦩',
  'Members Only':'🐘',
};

// Enrich events from backend with display extras
function enrichEvent(ev, index) {
  const categories = ['Family', 'Special', 'Seasonal', 'Family', 'Education', 'Members Only'];
  const spotsLeft  = [12, 48, 500, 6, 80, 22];
  const spotsTotal = [30, 100, 500, 12, 200, 40];
  const prices     = ['$75', '$45', 'Free', '$120', '$0', '$35'];
  const featured   = [true, false, true, false, false, false];

  return {
    ...ev,
    category  : categories[index % categories.length],
    spotsLeft : spotsLeft[index % spotsLeft.length],
    spotsTotal: spotsTotal[index % spotsTotal.length],
    displayPrice: prices[index % prices.length],
    featured  : featured[index % featured.length],
  };
}

// Format ISO date → "Fri, Mar 20"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const EventsPage = () => {
  const [events, setEvents]           = useState([]);
  const [search, setSearch]           = useState('');
  const [activeCategory, setCategory] = useState('All Events');
  const [gridView, setGridView]       = useState(true);
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await eventService.getAllEvents();
        setEvents(Array.isArray(data) ? data.map(enrichEvent) : []);
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = events.filter(ev => {
    const matchSearch   = ev.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'All Events' || ev.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const featuredEvents = filtered.filter(ev => ev.featured);
  const upcomingEvents = filtered.filter(ev => !ev.featured);

  const renderFeaturedCard = (ev) => {
    const pct       = Math.round((ev.spotsLeft / ev.spotsTotal) * 100);
    const isFree    = ev.displayPrice === 'Free' || ev.displayPrice === '$0';
    const isLow     = pct < 30;
    const emoji     = CATEGORY_EMOJI[ev.category] || '🎉';
    const startTime = ev.startTime || ev.time || '';
    const endTime   = ev.endTime   || '';
    const timeStr   = startTime ? `${startTime}${endTime ? ' - ' + endTime : ''}` : '';

    return (
      <div className="event-card featured-card" key={ev.id}>
        <div className="event-card-img-wrapper">
          {ev.imageUrl ? (
            <img src={ev.imageUrl} alt={ev.name} className="event-card-img" />
          ) : (
            <div className="event-card-placeholder">{emoji}</div>
          )}

          <span className="ev-badge-featured">
            <Star size={11} fill="#fff" stroke="none" /> Featured
          </span>
          <span className="ev-badge-category">{ev.category}</span>

          <div className="event-card-meta-overlay">
            <div className="event-meta-row">
              {ev.date && (
                <span className="event-meta-item">
                  <Calendar size={12} />
                  {formatDate(ev.date)}
                </span>
              )}
              {timeStr && (
                <span className="event-meta-item">
                  <Clock size={12} />
                  {timeStr}
                </span>
              )}
            </div>
            <h3 className="event-card-title">{ev.name}</h3>
            <p className="event-card-desc-overlay">
              {ev.description || `Join us for ${ev.name} — a unique wildlife experience!`}
            </p>
          </div>
        </div>

        <div className="event-card-body">
          <div className="event-card-location-row">
            <span className="event-location">
              <MapPin size={13} />
              {ev.exhibit || ev.location || 'Zoo-wide'}
            </span>
            <span className={`event-price ${isFree ? 'free' : ''}`}>
              {isFree ? 'Free' : ev.displayPrice}
              <span>/person</span>
            </span>
          </div>

          <div className="event-availability">
            <div className="event-spots-row">
              <span>{ev.spotsLeft} spots left</span>
              <span>{ev.spotsTotal} total</span>
            </div>
            <div className="event-progress-bar">
              <div
                className={`event-progress-fill ${isLow ? 'low' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <button className="event-book-btn">
            <BookOpen size={16} />
            Book Now
          </button>
        </div>
      </div>
    );
  };

  const renderUpcomingCard = (ev) => {
    const isFree    = ev.displayPrice === 'Free' || ev.displayPrice === '$0';
    const emoji     = CATEGORY_EMOJI[ev.category] || '🎉';
    const startTime = ev.startTime || ev.time || '';

    return (
      <div className="event-card upcoming-card" key={ev.id}>
        <div className="event-card-img-wrapper upcoming-img-wrapper">
          {ev.imageUrl ? (
            <img src={ev.imageUrl} alt={ev.name} className="event-card-img" />
          ) : (
            <div className="event-card-placeholder">{emoji}</div>
          )}
          
          <span className="ev-badge-category-upcoming">{ev.category}</span>
          
          {ev.date && (
            <div className="upcoming-img-date">
              <Calendar size={10} />
              {formatDate(ev.date)}
            </div>
          )}
        </div>

        <div className="event-card-body upcoming-card-body">
          <h3 className="upcoming-card-title">{ev.name}</h3>
          
          <div className="upcoming-meta-row">
             <span className="upcoming-meta-item"><Clock size={12} /> {startTime || 'TBD'}</span>
             <span className="upcoming-meta-item"><MapPin size={12} /> {ev.exhibit || ev.location || 'Zoo-wide'}</span>
          </div>

          <div className="upcoming-price-row">
             <span className={`upcoming-price ${isFree ? 'free' : ''}`}>
               {isFree ? 'Free' : ev.displayPrice}
             </span>
             <span className="upcoming-spots">{ev.spotsLeft} spots left</span>
          </div>

          <button className="event-book-btn">
            Book Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="events-page">

      {/* ── Hero ── */}
      <section className="events-hero">
        <div className="events-hero-bg" />
        <div className="events-hero-content">
          <h1 className="events-hero-title">Events &amp; Experiences</h1>
          <p className="events-hero-subtitle">
            Create unforgettable memories with unique wildlife encounters
          </p>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <div className="events-toolbar">
        <div className="events-search-wrapper">
          <Search className="events-search-icon" size={15} />
          <input
            className="events-search-input"
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="events-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`ev-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="events-toolbar-right">
          <button
            className={`ev-view-btn ${gridView ? 'active' : ''}`}
            onClick={() => setGridView(true)}
            title="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            className={`ev-view-btn ${!gridView ? 'active' : ''}`}
            onClick={() => setGridView(false)}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="events-main">
        {isLoading ? (
          <div className="events-empty">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="events-empty">
            <span style={{ fontSize: '2.5rem' }}>📅</span>
            <p style={{ marginTop: '12px' }}>No events found.</p>
          </div>
        ) : (
          <>
            {/* Featured Events Section */}
            {(featuredEvents.length > 0 && activeCategory === 'All Events') && (
              <section className="events-section">
                <h2 className="events-section-title">
                  <Star className="star-icon" size={18} fill="#f59e0b" stroke="none" />
                  Featured Events
                </h2>
                <div className={`events-grid featured-grid ${!gridView ? 'events-list-layout' : ''}`}>
                  {featuredEvents.map(ev => renderFeaturedCard(ev))}
                </div>
              </section>
            )}

            {/* Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
              <section className="events-section" style={{ marginTop: (featuredEvents.length > 0 && activeCategory === 'All Events') ? '48px' : '0' }}>
                <div className="events-section-header-row">
                  <h2 className="events-section-title" style={{ margin: 0 }}>Upcoming Events</h2>
                  <span className="events-count-text">Showing {upcomingEvents.length} events</span>
                </div>
                <div className={`events-grid upcoming-grid ${!gridView ? 'events-list-layout' : ''}`}>
                  {upcomingEvents.map(ev => renderUpcomingCard(ev))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Never Miss an Event Newsletter */}
        <section className="events-newsletter">
          <div className="events-newsletter-content">
            <h2>Never Miss an Event</h2>
            <p>Subscribe to our newsletter and be the first to know about upcoming events, exclusive member previews, and special offers.</p>
            <form className="events-newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EventsPage;
