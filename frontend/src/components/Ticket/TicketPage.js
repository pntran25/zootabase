// Ticket main page component
import React, { useEffect, useState } from 'react';
import { getTickets } from '../../services/ticketService';

const fallbackTickets = [
  { id: 'T-1001', type: 'Adult Day Pass', price: '$35.00', availability: 'Available' },
  { id: 'T-1002', type: 'Child Day Pass', price: '$22.00', availability: 'Available' },
  { id: 'T-1003', type: 'Family Bundle', price: '$99.00', availability: 'Low' },
];

const TicketPage = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await getTickets();
        setTickets(Array.isArray(data) && data.length ? data : fallbackTickets);
      } catch (error) {
        setTickets(fallbackTickets);
      }
    };

    loadTickets();
  }, []);

  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">Ticket Options</h1>
      <p className="zoo-page-subtitle">Compare pass types and choose the best option for your day.</p>

      <table className="zoo-table" aria-label="Ticket types table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Type</th>
            <th>Price</th>
            <th>Availability</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id || ticket.type}>
              <td>{ticket.id || 'N/A'}</td>
              <td>{ticket.type || ticket.name}</td>
              <td>{ticket.price || `$${Number(ticket.amount || 0).toFixed(2)}`}</td>
              <td>{ticket.availability || ticket.status || 'Available'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default TicketPage;
