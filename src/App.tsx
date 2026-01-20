import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import GeneratorPage from './pages/GeneratorPage'
import PricingPage from './pages/PricingPage'
import SuccessPage from './pages/SuccessPage'
import ProtectedRoute from './components/ProtectedRoute'
import SubscribedRoute from './components/SubscribedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/pricing"
        element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/success"
        element={
          <ProtectedRoute>
            <SuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <SubscribedRoute>
            <GeneratorPage />
          </SubscribedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
