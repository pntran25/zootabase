import React, { useState, useEffect } from 'react';
import './ExhibitPage.css';
import { Search, MapPin, Clock, Leaf, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getExhibits } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';
import placeholderImg from '../../../assets/images/Exhibits_Images/ExhibitsComingSoon.png';
import heroWildlife from '../../../assets/images/giraffe-habitat.jpg';

const REGION_PAGE_SIZE = 3;

const ExhibitPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Regions');
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionPage, setRegionPage] = useState(0);
  const [animKey, setAnimKey]     = useState(0);
  const [animDir, setAnimDir]     = useState('right');

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
            src={heroWildlife}
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
            </div>

            {/* RIGHT: Region Filters — paginated (3 at a time) */}
            <div className="ww-region-scroll-wrapper">
              <button
                className={`ww-scroll-arrow${regionPage === 0 ? ' ww-scroll-hidden' : ''}`}
                onClick={() => { setRegionPage(p => p - 1); setAnimDir('left');  setAnimKey(k => k + 1); }}
                aria-label="Previous regions"
              >
                <ChevronLeft size={16} />
              </button>

              <div key={animKey} className={`ww-region-filters ww-slide-${animDir}`}>
                {dynamicRegions
                  .slice(regionPage * REGION_PAGE_SIZE, regionPage * REGION_PAGE_SIZE + REGION_PAGE_SIZE)
                  .map(region => (
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
                className={`ww-scroll-arrow${regionPage >= Math.ceil(dynamicRegions.length / REGION_PAGE_SIZE) - 1 ? ' ww-scroll-hidden' : ''}`}
                onClick={() => { setRegionPage(p => p + 1); setAnimDir('right'); setAnimKey(k => k + 1); }}
                aria-label="Next regions"
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
                    src={exhibit.ImageUrl ? (exhibit.ImageUrl?.startsWith('http') ? exhibit.ImageUrl : `${API_BASE_URL}${exhibit.ImageUrl}`) : placeholderImg}
                    alt={exhibit.ExhibitName}
                  />
                  {exhibit.AreaName && (
                    <span className="ww-card-region">{exhibit.AreaName}</span>
                  )}
                  {(exhibit.IsFeatured === true || exhibit.IsFeatured === 1) && (
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
                    {exhibit.Description
                      ? exhibit.Description
                      : exhibit.HabitatType
                        ? `Experience the vast ${exhibit.HabitatType.toLowerCase()} habitat, home to amazing wildlife and majestic creatures.`
                        : 'Experience one of our beautiful animal habitats, carefully designed for conservation.'}
                  </p>

                  <div className="ww-card-chips">
                    {(() => {
                      const names = exhibit.AnimalNames
                        ? exhibit.AnimalNames.split(',').map(n => n.trim()).filter(Boolean)
                        : [];
                      if (names.length === 0) return null;
                      const visible = names.slice(0, 3);
                      const extra = names.length - visible.length;
                      return (
                        <>
                          {visible.map(name => (
                            <span key={name} className="ww-chip">{name}</span>
                          ))}
                          {extra > 0 && (
                            <span className="ww-chip">+{extra} more</span>
                          )}
                        </>
                      );
                    })()}
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
