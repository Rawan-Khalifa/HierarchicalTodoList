"use client"

import React, { createContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

// Create the context
export const AuthContext = createContext(null)

// Custom hook to use the auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        // Try to access a protected endpoint to check if logged in
        const response = await api.get("/api/todos/lists")
        if (response.status === 200) {
          // If successful, we're logged in
          // Since we don't have a /me endpoint, we'll just set a basic user object
          setCurrentUser({ username: localStorage.getItem("username") || "User" })
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        // Clear any stored username
        localStorage.removeItem("username")
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  const login = async (username, password) => {
    try {
      setError("")
      const response = await api.post("/api/auth/login", { username, password })

      // Store username for display purposes
      localStorage.setItem("username", response.data.user.username)
      setCurrentUser(response.data.user)
      navigate("/dashboard")
      return true
    } catch (error) {
      console.error("Login failed:", error)
      setError(error.response?.data?.error || "Login failed. Please try again.")
      return false
    }
  }

  const register = async (username, password) => {
    try {
      setError("")
      await api.post("/api/auth/register", { username, password })

      // After registration, log the user in
      return await login(username, password)
    } catch (error) {
      console.error("Registration failed:", error)
      setError(error.response?.data?.error || "Registration failed. Please try again.")
      return false
    }
  }

  const logout = async () => {
    try {
      await api.post("/api/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("username")
      setCurrentUser(null)
      navigate("/login")
    }
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext;

