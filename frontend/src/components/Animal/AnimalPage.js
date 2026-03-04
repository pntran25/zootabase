// Animal main page component
import React from 'react';

const AnimalPage = () => {
  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">Animals</h1>
      <p className="zoo-page-subtitle">Animal profile management area prepared for backend connection.</p>
      <section className="zoo-card">
        <h3>Animal Records</h3>
        <p>Connect this section to your `/api/animals` endpoints for full CRUD workflows.</p>
      </section>
    </main>
  );
};

export default AnimalPage;
