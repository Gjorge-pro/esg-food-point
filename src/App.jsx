import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CustomerPage } from './pages/CustomerPage';
import { ServiceDeskPage } from './pages/ServiceDeskPage';
import { AdminPage } from './pages/AdminPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const location = useLocation();
  const isFullscreenRoute = ['/service-desk', '/admin', '/staff-login', '/login'].includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      {!isFullscreenRoute && <Navbar />}
      <main className={isFullscreenRoute ? 'w-full' : 'flex-1 sm:ml-60 pt-16 sm:pt-0'}>
        <Routes>
          <Route path="/" element={<CustomerPage />} />
          <Route path="/order-history" element={<OrderHistoryPage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/login" element={<StaffLoginPage />} />
          <Route
            path="/service-desk"
            element={
              <ProtectedRoute requiredAccess="staff">
                <ServiceDeskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredAccess="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
