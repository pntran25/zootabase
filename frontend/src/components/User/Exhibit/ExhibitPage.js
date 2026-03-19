import React, { useState, useEffect } from 'react';
import './ExhibitPage.css';
import { Search, MapPin, Clock, Leaf } from 'lucide-react';
import { getExhibits } from '../../../services/exhibitService';
import { API_BASE_URL } from '../../../services/apiClient';
import placeholderImg from '../../../assets/images/Exhibits_Images/ExhibitsComingSoon.png';


const ExhibitPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Regions');
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <main className="exhibit-user-page">
      {/* Hero Section */}
      <section className="exhibit-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
              <h1 className="hero-title">Our Exhibits</h1>
              <p className="hero-subtitle">
                Explore immersive habitats from around the world and connect with over 500 species.
              </p>
          </div>
      </section>

      {/* Toolbar */}
      <div className="exhibit-toolbar-container">
          <div className="exhibit-toolbar">
              <div className="search-wrapper">
                  <Search size={20} className="search-icon"/>
                  <input 
                      type="text" 
                      placeholder="Search exhibits or animals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>

              <div className="region-filters">
                  {dynamicRegions.map(region => (
                      <button 
                          key={region} 
                          className={`region-btn ${activeCategory === region ? 'active' : ''}`}
                          onClick={() => setActiveCategory(region)}
                      >
                          {region}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="results-count">
          <p>Showing <strong>{filteredExhibits.length}</strong> exhibits</p>
      </div>

      {/* Grid */}
      <div className="exhibit-grid-container">
          {loading ? (
              <div className="loading-spinner">Loading exhibits...</div>
          ) : (
              <div className="exhibit-grid">
                  {filteredExhibits.map(exhibit => (
                      <div className="exhibit-card" key={exhibit.ExhibitID}>
                          <div 
                              className="card-header-image" 
                              style={{backgroundImage: `url(${exhibit.ImageUrl ? `${API_BASE_URL}${exhibit.ImageUrl}` : placeholderImg})`}}
                          >
                             <div className="card-badges">
                                  {exhibit.AreaName && <span className="badge region-badge">{exhibit.AreaName}</span>}
                                  {exhibit.ExhibitID % 2 === 1 && <span className="badge featured-badge">Featured</span>}
                             </div>
                          </div>
                          
                          <div className="card-body">
                              <div className="card-meta">
                                  <span><MapPin size={14}/> Zone {exhibit.AreaName || 'General'}</span>
                                  <span><Clock size={14}/> {exhibit.OpeningHours || '9AM - 5PM'}</span>
                              </div>
                              <h3 className="card-title">{exhibit.ExhibitName}</h3>
                              <p className="card-desc">
                                  {exhibit.HabitatType ? `Experience the ${exhibit.HabitatType.toLowerCase()} habitat, home to amazing wildlife.` : 'Experience one of our beautiful animal habitats.'}
                              </p>
                              
                              <div className="card-chips">
                                  {/* Dummy chips mapping to the exhibit name for visual richness */}
                                  <span className="chip">Native Species</span>
                                  <span className="chip">Conservation</span>
                              </div>
                          </div>

                          <div className="card-footer">
                              <div className="footer-stats">
                                   <span>👥 {exhibit.Capacity} Capacity</span>
                                   <span><Leaf size={14} style={{display:'inline', marginBottom: '-2px'}}/> {exhibit.HabitatType || 'Habitat'}</span>
                              </div>
                              <button className="visit-btn">Visit &rarr;</button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

    </main>
  );
};

export default ExhibitPage;
