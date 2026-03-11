import React, { useState } from 'react';
import './ExhibitPage.css';
import { Search, Leaf } from 'lucide-react';

const mockExhibits = [
  {
    id: 1,
    name: 'African Savanna',
    zone: 'Africa',
    animalCount: 3,
    biome: 'Grassland',
    description: 'A sprawling open plain featuring majestic African wildlife interacting as they would in the wild.',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cb2cb9a471f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    icon: '🦁'
  },
  {
    id: 2,
    name: 'Primate Forest',
    zone: 'Jungle',
    animalCount: 2,
    biome: 'Rainforest',
    description: 'A dense, multi-level canopy environment where our intelligent primate cousins thrive.',
    imageUrl: 'https://images.unsplash.com/photo-1540324155974-7523202daa3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    icon: '🐒'
  },
  {
    id: 3,
    name: 'Penguin Coast',
    zone: 'Arctic',
    animalCount: 1,
    biome: 'Tundra / Aquatic',
    description: 'Watch the energetic penguins plunge and swim in our state-of-the-art chiller facility.',
    imageUrl: 'https://images.unsplash.com/photo-1551410224-699683e15636?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    icon: '🐧'
  }
];

const categories = ['All', 'Africa', 'Jungle', 'Arctic', 'Asia', 'Australia', 'Reptiles'];

const ExhibitPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredExhibits = mockExhibits.filter(exhibit => {
    const matchesSearch = exhibit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exhibit.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || exhibit.zone === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="exhibit-page">
      <div className="exhibit-container">
        <h1 className="exhibit-page-title">Exhibits & Animals</h1>
        <p className="exhibit-page-subtitle">
          Explore diverse habitats and meet the amazing creatures that call WildHaven Zoo
          home. Click on an exhibit to see which animals live there.
        </p>

        <div className="exhibit-controls">
          <div className="search-bar-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search exhibits or animals..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="exhibit-filters-scroll">
            <div className="exhibit-filters">
              {categories.map(category => (
                <button
                  key={category}
                  className={`exhibit-filter-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="exhibit-grid">
          {filteredExhibits.map(exhibit => (
            <div className="exhibit-card" key={exhibit.id}>
              <div 
                className="exhibit-image-container"
                style={{ backgroundImage: `url(${exhibit.imageUrl})` }}
              >
                <div className="exhibit-image-overlay"></div>
                <div className="exhibit-badges">
                  <span className="zone-badge">{exhibit.zone}</span>
                  <span className="animal-count-badge">
                    <span>{exhibit.icon}</span> {exhibit.animalCount} Animals
                  </span>
                </div>
              </div>
              
              <div className="exhibit-card-content">
                <h3 className="exhibit-title">{exhibit.name}</h3>
                <p className="exhibit-description">{exhibit.description}</p>
                
                <div className="exhibit-footer">
                  <Leaf size={16} className="biome-icon" />
                  <span>{exhibit.biome}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ExhibitPage;
