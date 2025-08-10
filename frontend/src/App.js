import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Resources from './pages/Resources';
import AnalyzerView from './pages/AnalyzerView';

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={!token ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!token ? <Signup /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/dashboard/*"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/resources"
        element={token ? <Resources /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/analyzer/*"
        element={token ? <AnalyzerView /> : <Navigate to="/login" replace />}
      />
      {/* Optionally, catch all unknown routes and redirect */}
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
