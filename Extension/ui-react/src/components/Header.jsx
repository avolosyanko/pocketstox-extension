import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { useAuth } from '@/hooks/useExtensionAPI'

const Header = () => {
  const [user, setUser] = useState(null)
  const { signIn, signOut, getUser, loading } = useAuth()

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      try {
        const currentUser = await getUser()
        setUser(currentUser)
      } catch (error) {
        console.log('No user signed in')
      }
    }
    
    checkUser()
  }, [getUser])

  const handleSignIn = async () => {
    try {
      const userData = await signIn()
      setUser(userData)
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white flex-shrink-0">
      <div className="flex items-center min-w-0 flex-1">
        <img 
          src="../assets/images/logo-text-purple.svg" 
          alt="Pocketstox" 
          className="h-4 flex-shrink-0 max-w-[120px] object-contain"
        />
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={loading}
            className="flex items-center gap-1 text-xs px-2 py-1 h-auto"
          >
            <User size={12} />
            <span className="text-xs font-medium truncate max-w-[60px]">{user.name || 'Profile'}</span>
          </Button>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap px-2 py-1"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        )}
      </div>
    </header>
  )
}

export default Header