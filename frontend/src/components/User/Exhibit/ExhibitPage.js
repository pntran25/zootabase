import React, { useState, useEffect, useRef } from 'react';
import './ExhibitPage.css';
import { Search, MapPin, Clock, Leaf, Users, ArrowRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getExhibits } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';
import placeholderImg from '../../../assets/images/Exhibits_Images/ExhibitsComingSoon.png';

const ExhibitPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Regions');
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const regionRef = useRef(null);

  useEffect(() => {
    const fetchExhibits = async () => {
        try {
            const data = await getExhibits();
            setExhibits(data);
        } catch (error) {
            console.error("Failed to fetch exhibits:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchExhibits();
  }, []);

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;

    const checkScroll = () => {
      const tolerance = 2;
      setCanScrollLeft(el.scrollLeft > tolerance);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance);
    };

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    el.addEventListener('scroll', checkScroll);

    const timer = setTimeout(checkScroll, 100);
    const childObserver = new MutationObserver(checkScroll);
    childObserver.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      childObserver.disconnect();
      el.removeEventListener('scroll', checkScroll);
    };
  }, [exhibits]);

  const scrollRegions = (direction) => {
    const el = regionRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  // Compute dynamic categories based on regions
  const dynamicRegions = ['All Regions', ...Array.from(new Set(exhibits.map(e => e.AreaName).filter(Boolean)))];

  const filteredExhibits = exhibits.filter(exhibit => {
    const matchesSearch = exhibit.ExhibitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exhibit.AreaName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All Regions' || exhibit.AreaName === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="ww-exhibit-page">
      {/* ── HERO ── */}
      <section className="ww-exhibit-hero">
        <div className="ww-exh-hero-frame">
          <img 
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
            alt="Zoo exhibits" 
            className="ww-exh-hero-img" 
          />
          <div className="ww-exh-hero-overlay" />
          <div className="ww-exh-hero-content">
            <div>
              <h1 className="ww-exh-hero-title">Our Exhibits</h1>
              <p className="ww-exh-hero-sub">
                Explore immersive habitats from around the world and connect with over 500 species
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY TOOLBAR ── */}
      <section className="ww-toolbar-section">
        <div className="ww-toolbar-container">
          <div className="ww-toolbar-flex">
            {/* LEFT: Search + Filter */}
            <div className="ww-search-group">
              <div className="ww-search-wrap">
                <Search className="ww-search-icon" />
                <input 
                  className="ww-search-input"
                  type="text" 
                  placeholder="Search exhibits or animals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="ww-filter-btn">
                <Filter size={16} />
              </button>
            </div>

            {/* RIGHT: Region Filters with scroll arrows */}
            <div className="ww-region-scroll-wrapper">
              <button 
                className={`ww-scroll-arrow ww-scroll-arrow-left ${!canScrollLeft ? 'ww-scroll-hidden' : ''}`}
                onClick={() => scrollRegions('left')} 
                aria-label="Scroll regions left"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="ww-region-filters" ref={regionRef}>
                {dynamicRegions.map(region => (
                  <button 
                    key={region} 
                    className={`ww-region-btn ${activeCategory === region ? 'active' : ''}`}
                    onClick={() => setActiveCategory(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>

              <button 
                className={`ww-scroll-arrow ww-scroll-arrow-right ${!canScrollRight ? 'ww-scroll-hidden' : ''}`}
                onClick={() => scrollRegions('right')} 
                aria-label="Scroll regions right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTS COUNT ── */}
      <section className="ww-results-count">
        <p>Showing <strong>{filteredExhibits.length}</strong> exhibits</p>
      </section>

      {/* ── GRID ── */}
      <section className="ww-grid-section">
        {loading ? (
          <div className="ww-empty-state">Loading exhibits...</div>
        ) : filteredExhibits.length === 0 ? (
          <div className="ww-empty-state">
            <div className="ww-empty-icon"><Search /></div>
            <h3 className="ww-empty-title">No exhibits found</h3>
            <p className="ww-empty-sub">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="ww-grid">
            {filteredExhibits.map(exhibit => (
              <article className="ww-card" key={exhibit.ExhibitID}>
                <div className="ww-card-img-wrap">
                  <img 
                    src={exhibit.ImageUrl ? `${API_BASE_URL}${exhibit.ImageUrl}` : placeholderImg}
                    alt={exhibit.ExhibitName}
                  />
                  {exhibit.AreaName && (
                    <span className="ww-card-region">{exhibit.AreaName}</span>
                  )}
                  {exhibit.ExhibitID % 2 === 1 && (
                    <span className="ww-card-featured-badge">Featured</span>
                  )}
                </div>
                
                <div className="ww-card-body">
                  <div className="ww-card-meta">
                    <span><MapPin /> {exhibit.AreaName ? `Zone ${exhibit.AreaName}` : 'General'}</span>
                    <span><Clock /> {exhibit.OpeningHours || '9AM - 5PM'}</span>
                  </div>
                  
                  <h2 className="ww-card-title">{exhibit.ExhibitName}</h2>
                  
                  <p className="ww-card-desc">
                    {exhibit.HabitatType 
                      ? `Experience the vast ${exhibit.HabitatType.toLowerCase()} habitat, home to amazing wildlife and majestic creatures.` 
                      : 'Experience one of our beautiful animal habitats, carefully designed for conservation.'}
                  </p>

                  <div className="ww-card-chips">
                    {exhibit.ExhibitName === 'African Savanna' ? (
                      <>
                        <span className="ww-chip">Lions</span>
                        <span className="ww-chip">Giraffes</span>
                        <span className="ww-chip">Zebras</span>
                        <span className="ww-chip">+1 more</span>
                      </>
                    ) : (
                      <>
                        <span className="ww-chip">{exhibit.HabitatType || 'Habitat'}</span>
                        <span className="ww-chip">Conservation</span>
                      </>
                    )}
                  </div>

                  <div className="ww-card-footer">
                    <div className="ww-card-stats">
                      <span>
                        <Users /> 
                        {exhibit.Capacity ? Math.floor(exhibit.Capacity / 2) : ((exhibit.ExhibitID * 7) % 50 + 10)} animals 
                        <span className="acres">{((exhibit.ExhibitID * 3) % 20 + 5)} acres</span>
                      </span>
                    </div>
                    <button className="ww-visit-btn">
                      Visit <ArrowRight />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ExhibitPage;
