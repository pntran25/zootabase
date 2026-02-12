import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import AnimalPage from './components/Animal/AnimalPage';
import AttractionPage from './components/Attraction/AttractionPage';
import StaffPage from './components/Staff/StaffPage';
import CustomerPage from './components/Customer/CustomerPage';
import TicketPage from './components/Ticket/TicketPage';
import ProductPage from './components/Product/ProductPage';
import TransactionPage from './components/Transaction/TransactionPage';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 200, background: '#fff', minHeight: '100vh' }}>
          <Header />
          <div style={{ paddingTop: 70, paddingLeft: 20, paddingRight: 20 }}>
            <Routes>
              <Route path="/animals" element={<AnimalPage />} />
              <Route path="/attractions" element={<AttractionPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/customers" element={<CustomerPage />} />
              <Route path="/tickets" element={<TicketPage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/transactions" element={<TransactionPage />} />
              <Route path="*" element={<div>Welcome to Zootabase!</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
