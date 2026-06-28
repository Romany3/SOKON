import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Loading } from './components/Loading/Loading';
import { AIChatbot } from './components/AIChatbot';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import { AuthCallback } from './pages/AuthCallback';
import { StudentHome } from './pages/StudentHome';
import { MyApartment } from './pages/MyApartment';
import { Search } from './pages/Search';
import { Notifications } from './pages/Notifications';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { AddApartment } from './pages/AddApartment';
import { EditApartment } from './pages/EditApartment';
import { ApartmentDetails } from './pages/ApartmentDetails';
import { BookingRequests } from './pages/BookingRequests';
import { MyBookings } from './pages/MyBookings';
import { ChatPage } from './pages/ChatPage';
import { AllApartments } from './pages/AllApartments';
import { AllLocations } from './pages/AllLocations';
import { Universities } from './pages/Universities';
import { RoleSelection } from './pages/RoleSelection';
import { AccessDenied } from './pages/AccessDenied';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminApartments } from './pages/AdminApartments';
import { AdminUserDetails } from './pages/AdminUserDetails';
import { AdminApartmentDetails } from './pages/AdminApartmentDetails';
import { AdminMessages } from './pages/AdminMessages';
import { AdminLogs } from './pages/AdminLogs';

function AppShell() {
  const { loading: authLoading, user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/auth/callback' || pathname.startsWith('/forgot-password');
  const isAdminPath = pathname.startsWith('/admin');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let timeoutId;

    if (authLoading) {
      setShowSplash(true);
      return () => {};
    }

    timeoutId = window.setTimeout(() => {
      setShowSplash(false);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authLoading]);

  // Admin-Only Experience: If logged in as admin, redirect any non-admin path to dashboard
  // (except for login/register/auth related pages)
  if (isAuthenticated && user?.role === 'admin' && !isAdminPath && !isAuthPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password/reset" element={<ResetPassword />} />

        {/* Public browsing routes - Hidden from Admin via the Navigate above */}
        <Route path="/apartments" element={<AllApartments />} />
        <Route path="/locations" element={<AllLocations />} />
        <Route path="/universities" element={<Universities />} />

        {/* Profile Setup Routes */}
        <Route
          path="/role-selection"
          element={
            <ProtectedRoute allowIncomplete={true}>
              <RoleSelection />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowUnauthenticated={true}>
              <StudentHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-apartment"
          element={
            <ProtectedRoute requiredRole="owner">
              <MyApartment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-apartment"
          element={
            <ProtectedRoute requiredRole="owner">
              <AddApartment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-requests"
          element={
            <ProtectedRoute requiredRole="owner">
              <BookingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-apartment/:id"
          element={
            <ProtectedRoute requiredRole="owner">
              <EditApartment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute requiredRole="student">
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apartment/:id"
          element={
            <ProtectedRoute>
              <ApartmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <AdminRoute>
              <AdminUserDetails />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/apartments"
          element={
            <AdminRoute>
              <AdminApartments />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/apartments/:id"
          element={
            <AdminRoute>
              <AdminApartmentDetails />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminRoute>
              <AdminMessages />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminRoute>
              <AdminLogs />
            </AdminRoute>
          }
        />
        <Route path="/admin/access-denied" element={<AccessDenied />} />

        {/* Catch-all route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {!isAuthPage && !isAdminPath && <Loading visible={showSplash} />}
      
      {/* AI Chatbot - Integrated into the platform */}
      {!isAdminPath && <AIChatbot />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}

export default App;
