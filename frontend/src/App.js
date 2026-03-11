import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import HomePage from './components/User/Home/HomePage';
import AttractionPage from './components/User/Attraction/AttractionPage';
import ExhibitPage from './components/User/Exhibit/ExhibitPage';
import TicketPage from './components/User/Ticket/TicketPage';
import ProductPage from './components/User/Product/ProductPage';
import TransactionPage from './components/User/Transaction/TransactionPage';
import TicketingPage from './components/User/Ticketing/TicketingPage';

// Admin Imports
import AdminLayout from './layout/AdminLayout';
import Dashboard from './components/Admin/Dashboard/Dashboard';
import ManageAnimals from './components/Admin/ManageAnimals/ManageAnimals';
import ManageExhibits from './components/Admin/ManageExhibits/ManageExhibits';
import ManageAttractions from './components/Admin/ManageAttractions/ManageAttractions';
import ManageEvents from './components/Admin/ManageEvents/ManageEvents';
import ManageTickets from './components/Admin/ManageTickets/ManageTickets';
import ManageShop from './components/Admin/ManageShop/ManageShop';
import ManageMaintenance from './components/Admin/ManageMaintenance/ManageMaintenance';
import GuestFeedback from './components/Admin/GuestFeedback/GuestFeedback';

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Routes>
          {/* User Routes */}
          <Route path="/" element={
            <>
              <UserLayout />
              <div className="app-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/attractions" element={<AttractionPage />} />
                  <Route path="/exhibits" element={<ExhibitPage />} />
                  <Route path="/products" element={<ProductPage />} />
                  <Route path="/ticketing" element={<TicketingPage />} />
                  <Route path="/tickets" element={<TicketPage />} />
                  <Route path="/transactions" element={<TransactionPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </div>
            </>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<Dashboard />} />
             <Route path="animals" element={<ManageAnimals />} />
             <Route path="exhibits" element={<ManageExhibits />} />
             <Route path="attractions" element={<ManageAttractions />} />
             <Route path="events" element={<ManageEvents />} />
             <Route path="tickets" element={<ManageTickets />} />
             <Route path="shop" element={<ManageShop />} />
             <Route path="maintenance" element={<ManageMaintenance />} />
             <Route path="feedback" element={<GuestFeedback />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
