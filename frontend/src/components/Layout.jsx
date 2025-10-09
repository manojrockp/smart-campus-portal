import React from 'react'
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
  TrendingUp
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  
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
        { name: 'Semester History', href: '/semester-history', icon: Calendar },
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
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
          <h1 className="text-xl font-bold text-white flex items-center">
            <div className="h-8 w-8 bg-white rounded-lg mr-3 flex items-center justify-center">
              <span className="text-primary-600 font-bold text-sm">SC</span>
            </div>
            Smart Campus
          </h1>
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
                    className={`flex items-center px-4 py-3 mx-2 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white z-20">
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
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout