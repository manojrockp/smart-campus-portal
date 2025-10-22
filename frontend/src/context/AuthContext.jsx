import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import api from '../config/api'
import SessionManager from '../utils/sessionManager'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SessionManager.initializeSession()
    const user = SessionManager.getUser()
    if (user && SessionManager.isAuthenticated()) {
      setUser(user)
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data)
      SessionManager.setSession(SessionManager.getToken(), response.data)
    } catch (error) {
      SessionManager.clearSession()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email })
      const response = await api.post('/api/auth/login', { email, password })
      console.log('Login response:', response.data)
      
      const { token, user } = response.data
      
      SessionManager.setSession(token, user)
      setUser(user)
      
      return user
    } catch (error) {
      console.error('Login error details:', error)
      console.error('Error response:', error.response?.data)
      throw error
    }
  }

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    const { token, user } = response.data
    
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    
    return user
  }

  const logout = async () => {
    await SessionManager.logout()
    setUser(null)
  }

  const logoutAll = async () => {
    await SessionManager.logoutAll()
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    logoutAll,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}