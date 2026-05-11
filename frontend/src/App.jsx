import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Chat from "./pages/Chat.jsx";
import CounsellorDashboard from "./pages/CounsellorDashboard.jsx";
import CounsellorRequest from "./pages/CounsellorRequest.jsx";
import MoodTracker from "./pages/MoodTracker.jsx";
import ReadUpOnIt from "./pages/ReadUpOnIt.jsx";
import Resources from "./pages/Resources.jsx";
import Profile from "./pages/Profile.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";

function dashboardPathForRole(role) {
  if (role === "admin") return "/admin-dashboard";
  if (role === "consultant") return "/counsellor-dashboard";
  return "/user-dashboard";
}

function AuthRedirect({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mc-bg text-mc-muted">
        Loading…
      </div>
    );
  }
  if (user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={dashboardPathForRole(user?.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRedirect>
            <Register />
          </AuthRedirect>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="dashboard" element={<RoleRedirect />} />
        <Route
          path="user-dashboard"
          element={
            <ProtectedRoute roles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="counsellor-dashboard"
          element={
            <ProtectedRoute roles={["consultant"]}>
              <CounsellorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat"
          element={
            <ProtectedRoute roles={["user"]}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="mood"
          element={
            <ProtectedRoute roles={["user"]}>
              <MoodTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="exercise"
          element={
            <ProtectedRoute roles={["user"]}>
              <Resources />
            </ProtectedRoute>
          }
        />
        <Route
          path="counsellor-request"
          element={
            <ProtectedRoute roles={["user"]}>
              <CounsellorRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="read-up-on-it"
          element={
            <ProtectedRoute roles={["user"]}>
              <ReadUpOnIt />
            </ProtectedRoute>
          }
        />
        <Route
          path="resources"
          element={
            <ProtectedRoute roles={["user"]}>
              <Resources />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
