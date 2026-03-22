import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './layout/Header';
import HomePage from './components/Home/HomePage';
import AttractionPage from './components/Attraction/AttractionPage';
import TicketPage from './components/Ticket/TicketPage';
import ProductPage from './components/Product/ProductPage';
import TransactionPage from './components/Transaction/TransactionPage';
import TicketingPage from './components/Ticketing/TicketingPage';

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Routes>
          {/* User Routes */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/attractions" element={<AttractionPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/exhibits" element={<ExhibitPage />} />
            <Route path="/animals" element={<AnimalPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/ticketing" element={<TicketingPage />} />
            <Route path="/tickets" element={<TicketPage />} />
            <Route path="/transactions" element={<TransactionPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<HomePage />} />
          </Route>

          {/* Standalone Login and Signup routes — no UserLayout header */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={allStaffRoles}><AdminLayout /></ProtectedRoute>}>
             <Route index element={<Dashboard />} />
             <Route path="animals" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><ManageAnimals /></ProtectedRoute>} />
             <Route path="exhibits" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><ManageExhibits /></ProtectedRoute>} />
             <Route path="attractions" element={<ProtectedRoute allowedRoles={['Super Admin']}><ManageAttractions /></ProtectedRoute>} />
             <Route path="events" element={<ProtectedRoute allowedRoles={['Super Admin', 'Event Coordinator']}><ManageEvents /></ProtectedRoute>} />
             <Route path="tickets" element={<ProtectedRoute allowedRoles={['Super Admin', 'Ticket Staff']}><ManageTickets /></ProtectedRoute>} />
             <Route path="shop" element={<ProtectedRoute allowedRoles={['Super Admin', 'Shop Manager']}><ManageShop /></ProtectedRoute>} />
             <Route path="maintenance" element={<ProtectedRoute allowedRoles={['Super Admin', 'Maintenance']}><ManageMaintenance /></ProtectedRoute>} />
             <Route path="feedback" element={<ProtectedRoute allowedRoles={['Super Admin']}><GuestFeedback /></ProtectedRoute>} />
             <Route path="staff" element={<ProtectedRoute allowedRoles={['Super Admin']}><ManageStaff /></ProtectedRoute>} />
             <Route path="analytics" element={<ProtectedRoute allowedRoles={['Super Admin']}><LoginAnalytics /></ProtectedRoute>} />
             <Route path="reports" element={<ProtectedRoute allowedRoles={['Super Admin', 'Shop Manager']}><DataReports /></ProtectedRoute>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
