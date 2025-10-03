import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'

export default function Navigation() {
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    checkUser()
  }, [location.pathname])

  const checkUser = async () => {
    if (api.getToken()) {
      try {
        const userInfo = await api.getProfile(api.getToken())
        setUser(userInfo)
      } catch (error) {
        console.error('Failed to get user info:', error)
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }

  const handleLogout = () => {
    api.clearToken()
    setUser(null)
    navigate('/')
    setIsMenuOpen(false)
  }

  const getMenuItems = () => {
    if (!user) {
      return [
        { label: 'Home', path: '/', public: true },
        { label: 'Student Login', path: '/student/login', public: true },
        { label: 'Student Signup', path: '/student/signup', public: true },
        { label: 'Teacher Login', path: '/teacher/login', public: true },
        { label: 'Teacher Signup', path: '/teacher/signup', public: true },
      ]
    }

    if (user.role === 'teacher') {
      return [
        { label: 'Dashboard', path: '/teacher/dashboard' },
        { label: 'Experiments', path: '/teacher/experiments' },
        { label: 'Analytics', path: '/teacher/analytics' },
      ]
    }

    if (user.role === 'student') {
      return [
        { label: 'Dashboard', path: '/student/dashboard' },
        { label: 'My Progress', path: '/student/progress' },
        { label: 'Browse Exercises', path: '/gapfill' },
      ]
    }

    return []
  }

  const menuItems = getMenuItems()

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <button onClick={() => navigate('/')} className="brand-link">
            <h1>Thesis WebApp</h1>
          </button>
        </div>

        <div className="nav-content">
          {/* Desktop Menu */}
          <div className="nav-menu desktop-menu">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* User Info & Logout */}
          {user && (
            <div className="nav-user">
              <span className="user-info">
                Welcome, {user.name || user.email}
                <span className="user-role">({user.role})</span>
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="nav-menu mobile-menu">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setIsMenuOpen(false)
                }}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
            {user && (
              <button onClick={handleLogout} className="nav-item logout">
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
