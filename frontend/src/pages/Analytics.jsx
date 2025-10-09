import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import axios from 'axios'
import { TrendingUp, Users, BookOpen, Calendar, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

const Analytics = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'dashboard-analytics',
    async () => {
      const response = await axios.get('/api/analytics/dashboard')
      return response.data
    }
  )

  const { data: studentPerformance, isLoading: performanceLoading } = useQuery(
    'student-performance',
    async () => {
      const response = await axios.get('/api/analytics/student-performance')
      return response.data
    }
  )

  const { data: courseAnalytics, isLoading: courseLoading } = useQuery(
    'course-analytics',
    async () => {
      const response = await axios.get('/api/analytics/course-analytics')
      return response.data
    }
  )

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return 'text-red-600 bg-red-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into campus performance and trends</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: TrendingUp },
            { id: 'students', name: 'Student Performance', icon: Users },
            { id: 'courses', name: 'Course Analytics', icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Students"
              value={dashboardData.totalStudents}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Total Faculty"
              value={dashboardData.totalFaculty}
              icon={Users}
              color="indigo"
            />
            <StatCard
              title="Total Courses"
              value={dashboardData.totalCourses}
              icon={BookOpen}
              color="green"
            />
            <StatCard
              title="Recent Attendance"
              value={dashboardData.recentAttendance}
              icon={Calendar}
              color="purple"
              subtitle="Last 7 days"
            />
            <StatCard
              title="At-Risk Students"
              value={dashboardData.atRiskStudents}
              icon={AlertTriangle}
              color="red"
              subtitle="< 75% attendance"
            />
          </div>

          {/* Attendance Overview */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Attendance Overview</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.attendanceByStatus?.PRESENT || 0}
                  </p>
                  <p className="text-sm text-gray-500">Present</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.attendanceByStatus?.ABSENT || 0}
                  </p>
                  <p className="text-sm text-gray-500">Absent</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.attendanceByStatus?.LATE || 0}
                  </p>
                  <p className="text-sm text-gray-500">Late</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Performance Tab */}
      {activeTab === 'students' && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Student Performance Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentPerformance?.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.attendancePercentage}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.presentClasses}/{student.totalClasses} classes
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.enrolledCourses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(student.riskLevel)}`}>
                        {student.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Analytics Tab */}
      {activeTab === 'courses' && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Course Performance Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Records
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseAnalytics?.map((course) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.code} • {course.credits} credits</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.totalEnrollments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {course.averageAttendance}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="text-green-600">✅ {course.presentCount}</span> • 
                        <span className="text-red-600 ml-1">❌ {course.absentCount}</span> • 
                        <span className="text-yellow-600 ml-1">⏰ {course.lateCount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics