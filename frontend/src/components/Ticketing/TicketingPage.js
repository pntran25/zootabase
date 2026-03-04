import React from 'react';
import { Link } from 'react-router-dom';

const TicketingPage = () => {
  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">Tickets</h1>
      <p className="zoo-page-subtitle">Choose passes, compare options, and view your booking history.</p>

      <section className="zoo-grid">
        <article className="zoo-card">
          <h3>Ticket Options</h3>
          <p>Browse day passes, bundles, and seasonal entries before checkout.</p>
          <div className="zoo-actions">
            <Link to="/tickets" className="zoo-btn zoo-link">View Tickets</Link>
          </div>
        </article>

        <article className="zoo-card">
          <h3>Purchase History</h3>
          <p>See completed and pending payments for your recent bookings.</p>
          <div className="zoo-actions">
            <Link to="/transactions" className="zoo-btn secondary zoo-link">View Transactions</Link>
          </div>
        </article>
      </section>
    </main>
  );
};

export default TicketingPage;
