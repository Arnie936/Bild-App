import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface SubscribedRouteProps {
  children: ReactNode
}

export default function SubscribedRoute({ children }: SubscribedRouteProps) {
  const { user, isSubscribed, loading, subscriptionLoading } = useAuth()

  // Wait for both auth and subscription to load
  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isSubscribed) {
    return <Navigate to="/pricing" replace />
  }

  return <>{children}</>
}
