import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Resources from './pages/Resources';
import AnalyzerView from './pages/AnalyzerView';
import PodActionView from './pages/AnalyzerView/PodActionView/PodActionView';


function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!token ? <Signup /> : <Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/resources" element={token ? <Resources /> : <Navigate to="/resources" replace />} />
      <Route path="/analyzer" element={token ? <AnalyzerView /> : <Navigate to="/analyzer" replace />} />
      <Route path="/analyzer/pods" element={<PodActionView />} />
    </Routes>
  );
}

export default App;
