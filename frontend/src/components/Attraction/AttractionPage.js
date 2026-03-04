// Attraction main page component
import React, { useEffect, useState } from 'react';
import { getAttractions } from '../../services/attractionService';

const fallbackAttractions = [
  { id: 1, name: 'African Savanna', zone: 'Africa', hours: '9:00 AM - 6:00 PM', status: 'Open' },
  { id: 2, name: 'Tropical Rainforest', zone: 'Asia', hours: 'All day', status: 'Open' },
  { id: 3, name: 'Polar Tundra', zone: 'Arctic', hours: 'Closed for maintenance', status: 'Closed' },
];

const AttractionPage = () => {
  const [attractions, setAttractions] = useState([]);

  useEffect(() => {
    const loadAttractions = async () => {
      try {
        const data = await getAttractions();
        setAttractions(Array.isArray(data) && data.length ? data : fallbackAttractions);
      } catch (error) {
        setAttractions(fallbackAttractions);
      }
    };

    loadAttractions();
  }, []);

  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">Attractions</h1>
      <p className="zoo-page-subtitle">Browse habitats, encounter times, and open exhibits for your visit.</p>

      <table className="zoo-table" aria-label="Attractions table">
        <thead>
          <tr>
            <th>Attraction</th>
            <th>Zone</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attractions.map((attraction) => (
            <tr key={attraction.id || attraction.name}>
              <td>{attraction.name}</td>
              <td>{attraction.zone || attraction.region || 'N/A'}</td>
              <td>{attraction.hours || attraction.schedule || 'N/A'}</td>
              <td>
                <span className={`zoo-badge ${(attraction.status || '').toLowerCase() === 'closed' ? 'closed' : ''}`}>
                  {attraction.status || 'Open'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default AttractionPage;
