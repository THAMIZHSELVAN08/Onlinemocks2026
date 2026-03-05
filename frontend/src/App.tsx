import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import EvaluationPage from './pages/EvaluationPage';
import StudentDashboard from './pages/StudentDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import './App.css';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Router>
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500/10 selection:text-indigo-600">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route
            path="/admin/*"
            element={user?.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/hr/evaluate/:studentId"
            element={user?.role === 'HR' ? <EvaluationPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/hr/*"
            element={user?.role === 'HR' ? <HRDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/volunteer/*"
            element={user?.role === 'VOLUNTEER' ? <VolunteerDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/student/*"
            element={user?.role === 'STUDENT' ? <StudentDashboard /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
