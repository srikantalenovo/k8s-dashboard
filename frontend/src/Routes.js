import { Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';

const routes = [
  {
    path: '/login',
    element: <Login />,
    public: true
  },
  {
    path: '/signup',
    element: <Signup />,
    public: true
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    public: false
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    public: true
  }
];

export default routes;
