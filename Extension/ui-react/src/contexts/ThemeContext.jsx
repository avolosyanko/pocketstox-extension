import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    console.log('🚀 ThemeProvider initializing...')
    const savedTheme = localStorage.getItem('theme')
    console.log('💾 Saved theme from localStorage:', savedTheme)
    
    if (savedTheme) {
      console.log('✅ Using saved theme:', savedTheme)
      setTheme(savedTheme)
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = systemPrefersDark ? 'dark' : 'light'
      console.log('🖥️ Using system preference:', systemTheme)
      setTheme(systemTheme)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    console.log('🎯 Applying theme to DOM:', theme)
    const root = document.documentElement
    const body = document.body
    
    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
      console.log('✅ Added dark classes')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
      console.log('❌ Removed dark classes')
    }
    
    console.log('📄 HTML classes:', root.classList.toString())
    console.log('🏠 Body classes:', body.classList.toString())
    console.log('🌍 Current document:', document.title)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('🎨 Theme toggle clicked! Current:', theme, '→ New:', newTheme)
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    console.log('💾 Saved to localStorage:', localStorage.getItem('theme'))
  }

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}