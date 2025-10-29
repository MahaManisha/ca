import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem"; // ✅ NEW IMPORT
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import Requests from "./pages/Requests";
import PaymentPage from "./pages/PaymentPage"; // Razorpay Checkout
import PaymentSuccess from "./pages/PaymentSuccess";
import Notifications from "./pages/Notifications";
import MyItems from "./pages/MyItems";

// Knowledge Pages
import KnowledgeShare from "./pages/KnowledgeShare";
import KnowledgeList from "./pages/KnowledgeList";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManageUsers from "./pages/admin/AdminManageUsers";
import AdminManageItems from "./pages/admin/AdminManageItems";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

// Auth Success Handler
import AuthSuccess from "./pages/AuthSuccess";

// Components
import Footer from "./components/Footer";

// -------------------- Protected Route --------------------
const ProtectedRoute = ({ user, admin, children, adminOnly = false }) => {
  if (adminOnly && !admin) return <Navigate to="/admin-login" replace />;
  if (!adminOnly && !user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);   // Normal user
  const [admin, setAdmin] = useState(null); // Admin user
  const navigate = useNavigate();

  // -------------------- Initialize user/admin from localStorage --------------------
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedAdmin = JSON.parse(localStorage.getItem("admin"));
    if (storedUser) setUser(storedUser);
    if (storedAdmin) setAdmin(storedAdmin);
  }, []);

  // -------------------- Handle login --------------------
  const handleLogin = (loggedInUser) => {
    if (loggedInUser.role === "admin") {
      setAdmin(loggedInUser);
      localStorage.setItem("admin", JSON.stringify(loggedInUser));
      navigate("/admin", { replace: true });
    } else {
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      navigate("/home", { replace: true });
    }
  };

  // -------------------- Logout --------------------
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("token");
    setUser(null);
    setAdmin(null);
    navigate("/home", { replace: true });
  };

  return (
    <div>
      <Routes>
        {/* Public / Home */}
        <Route path="/" element={<Home user={user} setUser={setUser} />} />
        <Route path="/home" element={<Home user={user} setUser={setUser} />} />

        {/* Public Pages */}
        <Route path="/login" element={<Login setUser={handleLogin} />} />
        <Route path="/signup" element={<Signup setUser={handleLogin} />} />

        {/* Auth Success (Google OAuth) */}
        <Route
          path="/auth/success"
          element={<AuthSuccess setUser={handleLogin} />}
        />

        {/* User Protected Routes */}
        <Route
          path="/add-item"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <AddItem user={user} />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW ROUTE: Edit Item */}
        <Route
          path="/edit-item/:itemId"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <EditItem user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <Search user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <Cart user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <Contact user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <Requests user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <Notifications user={user} />
            </ProtectedRoute>
          }
        />

        {/* My Items Route */}
        <Route
          path="/my-items"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <MyItems user={user} />
            </ProtectedRoute>
          }
        />

        {/* Knowledge Share Pages */}
        <Route
          path="/knowledge-share"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <KnowledgeShare user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge-list"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <KnowledgeList user={user} />
            </ProtectedRoute>
          }
        />

        {/* Payment Pages */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <PaymentPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute user={user} admin={admin}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin setUser={handleLogin} />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} admin={admin} adminOnly>
              <AdminDashboard admin={admin} handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <ProtectedRoute user={user} admin={admin} adminOnly>
              <AdminManageUsers admin={admin} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-items"
          element={
            <ProtectedRoute user={user} admin={admin} adminOnly>
              <AdminManageItems admin={admin} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute user={user} admin={admin} adminOnly>
              <AdminAnalytics admin={admin} user={admin} handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {/* Footer only for non-admin */}
      {!admin && <Footer />}
    </div>
  );
}

export default App;