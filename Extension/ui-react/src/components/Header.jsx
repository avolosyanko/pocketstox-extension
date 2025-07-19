import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { useAuth } from '@/hooks/useExtensionAPI'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import { cn } from '@/lib/utils'

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
    <header className={cn("flex items-center justify-between border-b border-gray-100 bg-white flex-shrink-0", componentSpacing.headerPadding)}>
      <div className="flex items-center min-w-0 flex-1">
        <img 
          src="../assets/images/logo-text-purple.svg" 
          alt="Pocketstox" 
          className="h-5 flex-shrink-0 max-w-[140px] object-contain"
        />
      </div>
      
      <div className={cn("flex items-center flex-shrink-0", "gap-2")}>
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={loading}
            className={cn("flex items-center gap-2 h-auto px-3 py-1.5", semanticTypography.secondaryText)}
          >
            <User size={14} />
            <span className={cn("truncate max-w-[80px]", semanticTypography.caption)}>{user.name || 'Profile'}</span>
          </Button>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={loading}
            className={cn(
              semanticTypography.caption,
              "hover:text-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-gray-50"
            )}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        )}
      </div>
    </header>
  )
}

export default Header