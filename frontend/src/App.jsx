import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import './config/api' // Initialize API configuration
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Students from './pages/Students'
import Faculty from './pages/Faculty'
import Enrollments from './pages/Enrollments'
import Attendance from './pages/Attendance'
import AttendanceReport from './pages/AttendanceReport'
import Leaves from './pages/Leaves'

import Notices from './pages/Notices'
import Chat from './pages/Chat'
import Analytics from './pages/Analytics'
import FacultyCourseAssignment from './pages/FacultyCourseAssignment'
import FacultyAssignments from './pages/FacultyAssignments'
import AttendanceCalendar from './pages/AttendanceCalendar'
import FacultyAttendanceCalendar from './pages/FacultyAttendanceCalendar'
import SemesterManagement from './pages/SemesterManagement'
import DiagnosticTest from './pages/DiagnosticTest'
import StudentSemesters from './pages/StudentSemesters'
import SemesterHistory from './pages/SemesterHistory'


function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/students" element={<Students />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/enrollments" element={<Enrollments />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/attendance-report" element={<AttendanceReport />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/attendance-calendar" element={
          user.role === 'STUDENT' ? <AttendanceCalendar /> : <FacultyAttendanceCalendar />
        } />

        <Route path="/notices" element={<Notices />} />
        <Route path="/chat" element={<Chat />} />
        {(user.role === 'FACULTY' || user.role === 'ADMIN') && (
          <Route path="/analytics" element={<Analytics />} />
        )}
        {user.role === 'ADMIN' && (
          <Route path="/faculty-assignments" element={<FacultyAssignments />} />
        )}
        {user.role === 'ADMIN' && (
          <Route path="/semesters" element={<SemesterManagement />} />
        )}
        {user.role === 'ADMIN' && (
          <Route path="/diagnostic" element={<DiagnosticTest />} />
        )}
        {user.role === 'STUDENT' && (
          <Route path="/student-semesters" element={<StudentSemesters />} />
        )}
        {(user.role === 'ADMIN' || user.role === 'FACULTY') && (
          <Route path="/semester-history" element={<SemesterHistory />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App