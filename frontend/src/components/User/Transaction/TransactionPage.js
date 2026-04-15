// Transaction main page component
import React, { useEffect, useState } from 'react';
import { getTransactions } from '../../../services/transactionService';

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  return (
    <main className="zoo-page">
      <h1 className="zoo-page-title">My Transactions</h1>
      <p className="zoo-page-subtitle">Review your latest ticket and shop purchases.</p>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>No transactions found. Your ticket and shop purchases will appear here.</p>
      ) : (
        <table className="zoo-table" aria-label="Transactions table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id || transaction.transactionId}>
                <td>{transaction.channel || transaction.type || 'N/A'}</td>
                <td>{transaction.amount || `$${Number(transaction.total || 0).toFixed(2)}`}</td>
                <td>{transaction.state || transaction.status || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default TransactionPage;
