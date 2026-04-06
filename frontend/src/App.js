import './App.css';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}
import UserLayout from './layout/UserLayout';
import HomePage from './components/User/Home/HomePage';
import EventsPage from './components/User/Attraction/EventsPage';
import AttractionPage from './components/User/Attraction/AttractionPage';
import ExhibitPage from './components/User/Exhibit/ExhibitPage';
import AnimalPage from './components/User/Animal/AnimalPage';
import TicketPage from './components/User/Ticket/TicketPage';
import ProductPage from './components/User/Product/ProductPage';
import TransactionPage from './components/User/Transaction/TransactionPage';
import TicketingPage from './components/User/Ticketing/TicketingPage';
import MembershipPage from './components/User/Membership/MembershipPage';
import Login from './components/User/Auth/Login';
import Signup from './components/User/Auth/SignUp';
import ForgotPassword from './components/User/Auth/ForgotPassword';

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
import ProtectedRoute from './components/Admin/ProtectedRoute';
import ManageStaff from './components/Admin/ManageStaff/ManageStaff';
import LoginAnalytics from './components/Admin/Dashboard/LoginAnalytics';
import DataReports from './components/Admin/DataReports/DataReports';
import AnimalHealth from './components/Admin/AnimalHealth/AnimalHealth';
import AnimalReport from './components/Admin/AnimalHealth/AnimalReport';
import AnimalCare from './components/Admin/AnimalHealth/AnimalCare';
import ManageMemberships from './components/Admin/ManageMemberships/ManageMemberships';

const allStaffRoles = ['Super Admin', 'Caretaker', 'Event Coordinator', 'Ticket Staff', 'Shop Manager', 'Maintenance'];

function App() {
  return (
    <Router>
      <ScrollToTop />
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
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="*" element={<HomePage />} />
          </Route>

          {/* Standalone Login and Signup routes — no UserLayout header */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={allStaffRoles}><AdminLayout /></ProtectedRoute>}>
             <Route index element={<Dashboard />} />
             <Route path="animals" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><ManageAnimals /></ProtectedRoute>} />
             <Route path="exhibits" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><ManageExhibits /></ProtectedRoute>} />
             <Route path="attractions" element={<ProtectedRoute allowedRoles={['Super Admin']}><ManageAttractions /></ProtectedRoute>} />
             <Route path="events" element={<ProtectedRoute allowedRoles={['Super Admin', 'Event Coordinator']}><ManageEvents /></ProtectedRoute>} />
             <Route path="tickets" element={<ProtectedRoute allowedRoles={['Super Admin', 'Ticket Staff']}><ManageTickets /></ProtectedRoute>} />
             <Route path="shop" element={<ProtectedRoute allowedRoles={['Super Admin', 'Shop Manager']}><ManageShop /></ProtectedRoute>} />
             <Route path="maintenance" element={<ProtectedRoute allowedRoles={allStaffRoles}><ManageMaintenance /></ProtectedRoute>} />
             <Route path="feedback" element={<ProtectedRoute allowedRoles={['Super Admin']}><GuestFeedback /></ProtectedRoute>} />
             <Route path="staff" element={<ProtectedRoute allowedRoles={['Super Admin']}><ManageStaff /></ProtectedRoute>} />
             <Route path="analytics" element={<ProtectedRoute allowedRoles={['Super Admin']}><LoginAnalytics /></ProtectedRoute>} />
             <Route path="animal-health" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><AnimalHealth /></ProtectedRoute>} />
             <Route path="animal-care" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><AnimalCare /></ProtectedRoute>} />
             <Route path="animal-report" element={<ProtectedRoute allowedRoles={['Super Admin', 'Caretaker']}><AnimalReport /></ProtectedRoute>} />
             <Route path="reports" element={<ProtectedRoute allowedRoles={['Super Admin', 'Shop Manager']}><DataReports /></ProtectedRoute>} />
             <Route path="memberships" element={<ProtectedRoute allowedRoles={['Super Admin']}><ManageMemberships /></ProtectedRoute>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
