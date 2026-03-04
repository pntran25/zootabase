// Transaction main page component
import React, { useEffect, useState } from 'react';
import { getTransactions } from '../../services/transactionService';

const fallbackTransactions = [
  { id: 'TX-8801', channel: 'Online', amount: '$145.00', state: 'Completed' },
  { id: 'TX-8802', channel: 'Gift Shop POS', amount: '$58.50', state: 'Completed' },
  { id: 'TX-8803', channel: 'Front Desk', amount: '$22.00', state: 'Pending' },
];

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(Array.isArray(data) && data.length ? data : fallbackTransactions);
      } catch (error) {
        setTransactions(fallbackTransactions);
      }
    };

    loadTransactions();
  }, []);

  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">My Transactions</h1>
      <p className="zoo-page-subtitle">Review your latest ticket and shop purchases.</p>

      <table className="zoo-table" aria-label="Transactions table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Channel</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id || transaction.transactionId}>
              <td>{transaction.id || transaction.transactionId || 'N/A'}</td>
              <td>{transaction.channel || transaction.type || 'N/A'}</td>
              <td>{transaction.amount || `$${Number(transaction.total || 0).toFixed(2)}`}</td>
              <td>{transaction.state || transaction.status || 'Completed'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default TransactionPage;
