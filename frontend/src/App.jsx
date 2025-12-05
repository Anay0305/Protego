import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/useUserStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Register from './pages/Register';

function App() {
  const { isAuthenticated } = useUserStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}

        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/register"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Register />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Home /> : <Navigate to="/register" replace />
              }
            />
            <Route
              path="/alerts"
              element={
                isAuthenticated ? <Alerts /> : <Navigate to="/register" replace />
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated ? <Settings /> : <Navigate to="/register" replace />
              }
            />
            <Route
              path="/admin"
              element={
                isAuthenticated ? <Admin /> : <Navigate to="/register" replace />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
