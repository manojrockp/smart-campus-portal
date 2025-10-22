import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  BookOpen,
  Calendar, 
  FileText, 
  Bell, 
  MessageCircle, 
  BarChart3, 
  LogOut,
  User,
  Users,
  TrendingUp,
  Menu,
  ChevronLeft
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  console.log('Current user role:', user?.role)

  const getNavigationForRole = (role) => {
    console.log('Getting navigation for role:', role)
    
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Courses', href: '/courses', icon: BookOpen },
      { name: 'Notices', href: '/notices', icon: Bell },
      { name: 'Leaves', href: '/leaves', icon: Calendar },
      { name: 'Attendance', href: '/attendance', icon: Calendar },
      { name: 'Calendar View', href: '/attendance-calendar', icon: Calendar },
      { name: 'Reports', href: '/attendance-report', icon: TrendingUp },
    ]

    if (role === 'STUDENT') {
      return [
        ...baseNavigation,
        { name: 'Semesters', href: '/student-semesters', icon: Calendar },
        { name: 'My Calendar', href: '/attendance-calendar', icon: Calendar },
        { name: 'Reports', href: '/attendance-report', icon: TrendingUp },
      ]
    }

    if (role === 'FACULTY') {
      return [
        ...baseNavigation,
        { name: 'Students', href: '/students', icon: User },
        { name: 'Semester History', href: '/semester-history', icon: Calendar },
        { name: 'Calendar View', href: '/faculty-attendance-calendar', icon: Calendar },
        { name: 'Reports', href: '/attendance-report', icon: TrendingUp },
      ]
    }

    if (role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Semesters', href: '/semesters', icon: Calendar },
        { name: 'Students', href: '/students', icon: User },
        { name: 'Faculty', href: '/faculty', icon: Users },
        { name: 'Enrollments', href: '/enrollments', icon: Users },
        { name: 'Assign Courses', href: '/faculty-assignments', icon: Users },
        { name: 'Notices', href: '/notices', icon: Bell },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Diagnostic', href: '/diagnostic', icon: BarChart3 },
      ]
    }

    // Default navigation for any role
    return [
      ...baseNavigation,
      { name: 'My Calendar', href: '/attendance-calendar', icon: Calendar },
      { name: 'Reports', href: '/attendance-report', icon: TrendingUp },
    ]
  }

  const navigation = getNavigationForRole(user?.role)
  console.log('Navigation items:', navigation)
  console.log('User role:', user?.role)
  console.log('Is admin?', user?.role === 'ADMIN')
  console.log('Full user object:', user)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="flex h-16 items-center px-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
          {!isCollapsed ? (
            <>
              <h1 className="text-xl font-bold text-white flex items-center flex-1">
                <div className="h-8 w-8 bg-white rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-sm">SC</span>
                </div>
                Smart Campus
              </h1>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-white hover:bg-white/20 p-2 rounded-md transition-colors ml-2 bg-white/10"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-white hover:bg-white/20 p-2 rounded-md transition-colors bg-white/10"
                title="Expand Sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        <nav className="flex-1 mt-8 px-4 overflow-y-auto">
          <ul className="space-y-2 pb-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center ${isCollapsed ? 'px-2 py-3 mx-1 justify-center' : 'px-4 py-3 mx-2'} text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`} />
                    {!isCollapsed && item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white z-20">
          {!isCollapsed && (
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center mb-3">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center w-full ${isCollapsed ? 'px-2 py-2 justify-center' : 'px-4 py-2'} text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-4 w-4`} />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`${isCollapsed ? 'pl-16' : 'pl-64'} transition-all duration-300`}>
        <main className="py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout