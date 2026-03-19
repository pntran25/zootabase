import React, { useState, useEffect, useCallback } from 'react';
import animalService from '../../../services/animalService';
import './AnimalPage.css';
import { API_BASE_URL } from '../../../services/apiClient';
import { ArrowRight, Info, Heart, MapPin, Clock } from 'lucide-react';

// Map health status to badge style
function getStatusBadge(health) {
  const h = (health || '').toLowerCase();
  if (h.includes('critical') || h.includes('endangered'))
    return { label: 'Endangered',       cls: 'ww-status-endangered' };
  if (h.includes('fair') || h.includes('vulnerable') || h.includes('checkup'))
    return { label: 'Vulnerable',       cls: 'ww-status-vulnerable' };
  if (h.includes('near'))
    return { label: 'Near Threatened',  cls: 'ww-status-near-threatened' };
  if (h.includes('good') || h.includes('excellent'))
    return { label: 'Least Concern',    cls: 'ww-status-least-concern' };
  return { label: health || 'Unknown',  cls: 'ww-status-default' };
}

const AnimalPage = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [liked,   setLiked]   = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await animalService.getAllAnimals();
        setAnimals(data);
      } catch (err) {
        console.error('Error fetching animals:', err);
        setError('Failed to load animals.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleLike = useCallback((id) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (loading) return <div className="ww-animal-loading">Loading animals...</div>;
  if (error)   return <div className="ww-animal-error">{error}</div>;

  return (
    <div className="ww-animal-page">
      <header className="ww-animal-header">
        <h1>Meet Our Animals</h1>
        <p>Discover the incredible species entrusted to our care.</p>
      </header>

      <div className="ww-animal-grid">
        {animals.map(animal => {
          const badge   = getStatusBadge(animal.health);
          const isLiked = liked[animal.id];

          return (
            <div className="ww-animal-card" key={animal.id}>
              {/* Background image */}
              {animal.imageUrl ? (
                <img
                  src={`${API_BASE_URL}${animal.imageUrl}`}
                  alt={animal.name}
                  className="ww-animal-card-bg"
                />
              ) : (
                <div className="ww-animal-card-placeholder-bg">🐾</div>
              )}

              {/* Gradient for text legibility */}
              <div className="ww-animal-card-gradient" />

              {/* Top row — status badge + heart */}
              <div className="ww-card-top-row">
                <span className={`ww-status-badge ${badge.cls}`}>
                  {badge.label}
                </span>
                <button
                  className={`ww-heart-btn ${isLiked ? 'liked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleLike(animal.id); }}
                >
                  <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} />
                </button>
              </div>

              {/* Bottom info — normal state */}
              <div className="ww-card-bottom-info">
                <p className="ww-card-species">{animal.species}</p>
                <h3 className="ww-card-name">{animal.name}</h3>
                <div className="ww-card-meta-row">
                  <span className="ww-card-meta-item">
                    <MapPin size={12} /> {animal.exhibit || 'Zoo-wide'}
                  </span>
                  <span className="ww-card-meta-item">
                    <Clock size={12} /> {animal.age ? `${animal.age} yrs` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Quick Facts overlay — hover state */}
              <div className="ww-quick-facts-overlay">
                <h4 className="ww-quick-facts-title">Quick Facts</h4>
                <div className="ww-quick-facts-list">
                  <div className="ww-quick-fact-item">
                    <strong>Diet:</strong> {animal.diet || 'Unknown'}
                  </div>
                  <div className="ww-quick-fact-item">
                    <strong>Lifespan:</strong> {animal.lifespan || 'Unknown'}
                  </div>
                  <div className="ww-quick-fact-item">
                    <strong>Weight:</strong> {animal.weight || 'Unknown'}
                  </div>
                  <div className="ww-quick-fact-item">
                    <strong>Region:</strong> {animal.region || 'Unknown'}
                  </div>
                </div>

                {animal.funFact && (
                  <div className="ww-fun-fact">
                    <Info className="ww-fun-fact-icon" size={14} />
                    {animal.funFact}
                  </div>
                )}

                <button className="ww-learn-more-btn">
                  Learn More <ArrowRight size={14} />
                </button>
              </div>

              {/* Bottom meta — stays visible on hover too */}
              <div className="ww-card-bottom-meta-hover">
                <span className="ww-card-meta-item">
                  <MapPin size={11} /> {animal.exhibit || 'Zoo-wide'}
                </span>
                <span className="ww-card-meta-item">
                  <Clock size={11} /> {animal.age ? `${animal.age} yrs` : 'N/A'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimalPage;
