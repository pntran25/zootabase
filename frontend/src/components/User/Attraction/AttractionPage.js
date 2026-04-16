import React, { useState, useEffect } from 'react';
import './AttractionPage.css';
import { Search, MapPin, Users, Clock, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { getAllAttractions } from '../../../services/attractionService';
import { API_BASE_URL } from '../../../services/apiClient';
import attractionsHero from '../../../assets/images/attractions-hero.png';

const TYPE_META = {
  Ride:        { emoji: '🎢', gradient: 'linear-gradient(145deg, #1a4fa0 0%, #0d2a5c 100%)', fallbackDesc: 'An exciting ride through the zoo grounds, perfect for the whole family.' },
  Show:        { emoji: '🎭', gradient: 'linear-gradient(145deg, #6b21a8 0%, #3b0764 100%)', fallbackDesc: 'A captivating live performance featuring our incredible animal ambassadors.' },
  Experience:  { emoji: '✨', gradient: 'linear-gradient(145deg, #b45309 0%, #78350f 100%)', fallbackDesc: 'Get up-close and personal with some of nature\'s most fascinating creatures.' },
  Encounter:   { emoji: '🐾', gradient: 'linear-gradient(145deg, #166534 0%, #052e16 100%)', fallbackDesc: 'A unique hands-on encounter with wildlife guided by our expert keepers.' },
  Feeding:     { emoji: '🦒', gradient: 'linear-gradient(145deg, #92400e 0%, #451a03 100%)', fallbackDesc: 'Hand-feed some of the zoo\'s most beloved animals under keeper supervision.' },
  'Play Area': { emoji: '🛝', gradient: 'linear-gradient(145deg, #0e7490 0%, #164e63 100%)', fallbackDesc: 'A fun play zone designed for young explorers and families.' },
  Tour:        { emoji: '🚌', gradient: 'linear-gradient(145deg, #374151 0%, #111827 100%)', fallbackDesc: 'A guided tour through the best exhibits and hidden gems of the zoo.' },
};

function getTypeMeta(type) {
  return TYPE_META[type] || { emoji: '🎡', gradient: 'linear-gradient(145deg, #374151 0%, #111827 100%)', fallbackDesc: 'A fun and memorable experience awaiting you at Zootabase Zoo.' };
}

// Convert "HH:MM–HH:MM" → "9AM – 5PM" for display
function fmt12(t) {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return mStr && mStr !== '00' ? `${h12}:${mStr}${period}` : `${h12}${period}`;
}

function formatHours(h) {
  if (!h) return null;
  const parts = h.split(/[–\-]/);
  if (parts.length < 2) return h;
  return `${fmt12(parts[0].trim())} – ${fmt12(parts[1].trim())}`;
}

const AttractionCard = ({ attraction }) => {
  const { emoji, gradient, fallbackDesc } = getTypeMeta(attraction.type);
  const isOpen = attraction.status === 'Open';
  const hoursDisplay = formatHours(attraction.hours);

  return (
    <article className="ww-attr-card">
      {/* Image */}
      <div className="ww-attr-card-img-wrap">
        {attraction.imageUrl ? (
          <img
            src={`${API_BASE_URL}${attraction.imageUrl}`}
            alt={attraction.name}
            className="ww-attr-card-real-img"
          />
        ) : (
          <div className="ww-attr-card-img-bg" style={{ background: gradient }}>
            <span className="ww-attr-card-emoji">{emoji}</span>
          </div>
        )}

        {/* Closed overlay */}
        {!isOpen && (
          <div className="ww-attr-closed-overlay">
            <span className="ww-attr-closed-banner">Currently Closed</span>
          </div>
        )}

        <span className="ww-attr-type-badge">{attraction.type}</span>
        {attraction.price != null && (
          <span className={`ww-attr-price-badge ${attraction.price === 0 ? 'free' : 'paid'}`}>
            {attraction.price === 0 ? 'Free' : `$${Number(attraction.price).toFixed(2)}`}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="ww-attr-card-body">
        <h3 className="ww-attr-card-title">{attraction.name}</h3>
        <p className="ww-attr-card-desc">{attraction.description || fallbackDesc}</p>
        <div className="ww-attr-card-meta">
          <span><MapPin size={13} /> {attraction.location || 'Zoo Grounds'}</span>
          {attraction.duration && <span><Clock size={13} /> {String(attraction.duration).replace(/\s*(minutes?|mins?)\s*/gi, '')} min</span>}
          {attraction.ageGroup && <span><Users size={13} /> {attraction.ageGroup}</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="ww-attr-card-footer">
        <span className="ww-attr-footer-hours">
          <span className={`ww-attr-status-dot ${isOpen ? 'open' : 'closed'}`} />
          {hoursDisplay || (isOpen ? 'Currently Open' : 'Currently Closed')}
        </span>
      </div>
    </article>
  );
};

const AttractionPage = () => {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeAgeGroup, setActiveAgeGroup] = useState('All');
  const [activeDuration, setActiveDuration] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const data = await getAllAttractions();
        setAttractions(data);
      } catch (err) {
        console.error('Failed to fetch attractions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttractions();
  }, []);

  const types = ['All', ...Array.from(new Set(attractions.map(a => a.type).filter(Boolean)))];
  const ageGroups = ['All', ...Array.from(new Set(attractions.map(a => a.ageGroup).filter(Boolean)))];
  const durations = ['All', ...Array.from(new Set(attractions.map(a => a.duration).filter(Boolean))).sort((a, b) => parseInt(a) - parseInt(b))];

  const activeFilterCount = [activeType !== 'All', activeAgeGroup !== 'All', activeDuration !== 'All'].filter(Boolean).length;

  const filtered = attractions.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = activeType === 'All' || a.type === activeType;
    const matchAge = activeAgeGroup === 'All' || a.ageGroup === activeAgeGroup;
    const matchDuration = activeDuration === 'All' || a.duration === activeDuration;
    return matchSearch && matchType && matchAge && matchDuration;
  });

  return (
    <main className="ww-attr-page">
      {/* ── HERO ── */}
      <section className="ww-attr-hero">
        <div className="ww-attr-hero-frame">
          <img
            src={attractionsHero}
            alt="Attractions at Zootabase Zoo"
            className="ww-attr-hero-img"
          />
          <div className="ww-attr-hero-overlay" />
          <div className="ww-attr-hero-content">
            <div>
              <h1 className="ww-attr-hero-title">Attractions</h1>
              <p className="ww-attr-hero-sub">
                Rides, shows, and up-close animal encounters — something for everyone
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY TOOLBAR ── */}
      <section className="ww-attr-toolbar-section">
        <div className="ww-attr-toolbar-container">
          <div className="ww-attr-toolbar-flex">
            <div className="ww-search-group">
              <div className="ww-search-wrap">
                <Search className="ww-search-icon" />
                <input
                  className="ww-search-input"
                  type="text"
                  placeholder="Search attractions or locations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              className={`ww-filter-toggle-btn${filtersOpen ? ' open' : ''}`}
              onClick={() => setFiltersOpen(f => !f)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && <span className="ww-filter-badge">{activeFilterCount}</span>}
              <ChevronDown size={14} className={`ww-filter-chevron${filtersOpen ? ' rotated' : ''}`} />
            </button>
          </div>

          {/* Expandable Filter Panel */}
          {filtersOpen && (
            <div className="ww-filter-panel">
              <div className="ww-filter-panel-group">
                <label className="ww-filter-panel-label">Type</label>
                <select
                  className="ww-filter-select"
                  value={activeType}
                  onChange={e => setActiveType(e.target.value)}
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="ww-filter-panel-group">
                <label className="ww-filter-panel-label">Age Group</label>
                <select
                  className="ww-filter-select"
                  value={activeAgeGroup}
                  onChange={e => setActiveAgeGroup(e.target.value)}
                >
                  {ageGroups.map(ag => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
              </div>
              <div className="ww-filter-panel-group">
                <label className="ww-filter-panel-label">Duration</label>
                <select
                  className="ww-filter-select"
                  value={activeDuration}
                  onChange={e => setActiveDuration(e.target.value)}
                >
                  {durations.map(d => (
                    <option key={d} value={d}>{d === 'All' ? 'All' : `${d}`}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="ww-attr-section">
        <div className="ww-attr-container">
          {!loading && (
            <p className="ww-attr-count">
              Showing <strong>{filtered.length}</strong> attraction{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
          {loading ? (
            <div className="ww-attr-empty">Loading attractions...</div>
          ) : filtered.length === 0 ? (
            <div className="ww-attr-empty">
              <div className="ww-attr-empty-icon"><Search /></div>
              <h3 className="ww-attr-empty-title">No attractions found</h3>
              <p className="ww-attr-empty-sub">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="ww-attr-grid">
              {filtered.map(a => <AttractionCard key={a.id} attraction={a} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default AttractionPage;
