'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/app-context'

/**
 * useAuth Hook
 *
 * Custom hook for handling authentication state and route protection.
 * Provides easy access to auth-related state and actions.
 *
 * @param options.required - If true, redirects unauthenticated users to login
 * @param options.redirectTo - Custom redirect path (default: '/login')
 * @param options.redirectIfAuthenticated - If true, redirects authenticated users (for login page)
 * @param options.redirectAuthenticatedTo - Where to redirect authenticated users (default: '/feed')
 *
 * @example
 * // Protected page - redirect to login if not authenticated
 * const { user, isLoading } = useAuth({ required: true })
 *
 * @example
 * // Login page - redirect to feed if already authenticated
 * const { user } = useAuth({ redirectIfAuthenticated: true })
 *
 * @example
 * // Just check auth status
 * const { user, isAuthenticated, login, logout } = useAuth()
 */
interface UseAuthOptions {
  required?: boolean
  redirectTo?: string
  redirectIfAuthenticated?: boolean
  redirectAuthenticatedTo?: string
}

export function useAuth(options: UseAuthOptions = {}) {
  const {
    required = false,
    redirectTo = '/login',
    redirectIfAuthenticated = false,
    redirectAuthenticatedTo = '/feed',
  } = options

  const router = useRouter()
  const { user, login, logout, isHydrated } = useApp()

  const isAuthenticated = !!user
  const isLoading = !isHydrated

  // Handle redirect for protected routes
  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return

    // Redirect unauthenticated users from protected routes
    if (required && !isAuthenticated) {
      router.replace(redirectTo)
      return
    }

    // Redirect authenticated users away from auth pages (login, register)
    if (redirectIfAuthenticated && isAuthenticated) {
      router.replace(redirectAuthenticatedTo)
      return
    }
  }, [
    isHydrated,
    isAuthenticated,
    required,
    redirectTo,
    redirectIfAuthenticated,
    redirectAuthenticatedTo,
    router,
  ])

  return {
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    login,
    logout,
  }
}

/**
 * withAuth Higher-Order Component
 *
 * Wraps a component to require authentication.
 * Shows a loading state while checking auth, then redirects or renders.
 *
 * @example
 * export default withAuth(DashboardPage)
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UseAuthOptions = { required: true }
) {
  return function AuthenticatedComponent(props: P) {
    const { isLoading, isAuthenticated } = useAuth(options)

    // Show loading state while checking auth
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        </div>
      )
    }

    // If auth is required but user is not authenticated, useAuth will redirect
    // So we just need to not render the component
    if (options.required && !isAuthenticated) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
