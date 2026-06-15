import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Theaters from './pages/admin/Theaters';
import TheaterDesigner from './pages/admin/TheaterDesigner';
import Movies from './pages/admin/Movies';
import Shows from './pages/admin/Shows';
import ShowBookings from './pages/admin/ShowBookings';
import SmsLogs from './pages/admin/SmsLogs';
import BookingPage from './pages/book/BookingPage';
import Success from './pages/book/Success';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />

          <Route path="/admin/login" element={<Login />} />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="theaters" element={<Theaters />} />
            <Route path="theaters/:id/design" element={<TheaterDesigner />} />
            <Route path="movies" element={<Movies />} />
            <Route path="shows" element={<Shows />} />
            <Route path="shows/:id/bookings" element={<ShowBookings />} />
            <Route path="sms-logs" element={<SmsLogs />} />
          </Route>

          <Route path="/book/:slug" element={<BookingPage />} />
          <Route path="/booking/:id/success" element={<Success />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
