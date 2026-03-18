import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './layout/Header';
import HomePage from './components/Home/HomePage';
import AttractionPage from './components/Attraction/AttractionPage';
import TicketPage from './components/Ticket/TicketPage';
import ProductPage from './components/Product/ProductPage';
import TransactionPage from './components/Transaction/TransactionPage';
import TicketingPage from './components/Ticketing/TicketingPage';
import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Header />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/attractions" element={<AttractionPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/ticketing" element={<TicketingPage />} />
            <Route path="/tickets" element={<TicketPage />} />
            <Route path="/transactions" element={<TransactionPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
