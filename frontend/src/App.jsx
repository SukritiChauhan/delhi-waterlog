import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Complaint from './pages/Complaint'

function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user'))
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/complaint" element={<Complaint />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App