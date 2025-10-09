import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Calendar, FileText, Bell, Users, TrendingUp, AlertTriangle, User, BookOpen, Clock, BarChart3 } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()

  const { data: dashboardData } = useQuery(
    'dashboard',
    async () => {
      if (user.role === 'FACULTY' || user.role === 'ADMIN') {
        const response = await axios.get('/api/analytics/dashboard')
        return response.data
      }
      return null
    },
    { enabled: user.role === 'FACULTY' || user.role === 'ADMIN' }
  )

  const { data: notices } = useQuery('notices', async () => {
    const response = await axios.get('/api/notices')
    return response.data.slice(0, 5) // Get latest 5 notices
  })

  const { data: studentDetails, isLoading: studentDetailsLoading } = useQuery(
    'student-details',
    async () => {
      const response = await axios.get('/api/users/student-details')
      console.log('Student details:', response.data)
      return response.data
    },
    { enabled: user.role === 'STUDENT' }
  )



  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">Here's what's happening in your campus today.</p>
      </div>

      {/* Student Details */}
      {user.role === 'STUDENT' && studentDetails && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Student Details
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {studentDetails.firstName} {studentDetails.lastName}</p>
                  <p><span className="font-medium">Student ID:</span> {studentDetails.studentId}</p>
                  <p><span className="font-medium">Email:</span> {studentDetails.email}</p>
                  <p><span className="font-medium">Section:</span> {studentDetails.section || 'Not assigned'}</p>
                  <p><span className="font-medium">Academic Year:</span> {studentDetails.year ? `Year ${studentDetails.year}` : 'Not assigned'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                  Academic Progress
                </h3>
                <div className="space-y-3 text-sm">
                  {studentDetails.currentSemester ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-800 mb-2">Current Semester</p>
                      <p><span className="font-medium">Semester:</span> {studentDetails.currentSemester.name}</p>
                      <p><span className="font-medium">Code:</span> {studentDetails.currentSemester.code}</p>
                      <p><span className="font-medium">Start:</span> {new Date(studentDetails.currentSemester.startDate).toLocaleDateString()}</p>
                      <p><span className="font-medium">End:</span> {new Date(studentDetails.currentSemester.endDate).toLocaleDateString()}</p>
                      {studentDetails.currentSemester.attendanceStats && (
                        <div className="mt-2 pt-2 border-t border-green-300">
                          <p className="text-xs text-green-700">
                            <span className="font-medium">Attendance:</span> {studentDetails.currentSemester.attendanceStats.attendancePercentage}% 
                            ({studentDetails.currentSemester.attendanceStats.presentClasses}/{studentDetails.currentSemester.attendanceStats.totalClasses})
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No active semester found</p>
                  )}
                  
                  {studentDetails.semesterHistory && studentDetails.semesterHistory.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-800 mb-2">Completed Semesters ({studentDetails.semesterHistory.length})</p>
                      <div className="space-y-2">
                        {studentDetails.semesterHistory.map((semester, index) => (
                          <div key={semester.id} className="p-2 bg-white rounded border border-blue-200">
                            <div className="text-xs text-blue-700 font-medium">
                              {index + 1}. {semester.name} ({semester.code}) - Completed
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                            </div>
                            {semester.attendanceStats && (
                              <div className="text-xs text-blue-600 mt-1">
                                Attendance: {semester.attendanceStats.attendancePercentage}% 
                                ({semester.attendanceStats.presentClasses}/{semester.attendanceStats.totalClasses} classes)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    Total Semesters: {studentDetails.totalSemesters || 0}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
                  Enrolled Courses
                </h3>
                <div className="space-y-2 text-sm">
                  {studentDetails.enrollments && studentDetails.enrollments.length > 0 ? (
                    <div className="space-y-1">
                      <p><span className="font-medium">Total Courses:</span> {studentDetails.enrollments.length}</p>
                      <p><span className="font-medium">Total Credits:</span> {studentDetails.enrollments.reduce((sum, enrollment) => sum + (enrollment.course?.credits || 0), 0)}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No courses enrolled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats for Faculty/Admin */}
      {(user.role === 'FACULTY' || user.role === 'ADMIN') && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={dashboardData.totalStudents}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Courses"
            value={dashboardData.totalCourses}
            icon={FileText}
            color="green"
          />
          <StatCard
            title="Recent Attendance"
            value={dashboardData.recentAttendance}
            icon={Calendar}
            color="purple"
          />
          <StatCard
            title="At-Risk Students"
            value={dashboardData.atRiskStudents}
            icon={AlertTriangle}
            color="red"
          />
        </div>
      )}

      {/* Recent Notices */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary-600" />
            Recent Notices
          </h2>
        </div>
        <div className="p-6">
          {notices && notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-medium text-gray-900">{notice.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notice.content.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent notices</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {user.role === 'STUDENT' && (
            <>
              <a href="/attendance" className="p-6 text-center border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-primary-50 hover:to-blue-50 hover:border-primary-200 transition-all duration-200 group">
                <Calendar className="h-8 w-8 mx-auto mb-3 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700">View Attendance</span>
              </a>

            </>
          )}
          {(user.role === 'FACULTY' || user.role === 'ADMIN') && (
            <>
              <a href="/attendance" className="p-6 text-center border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-primary-50 hover:to-blue-50 hover:border-primary-200 transition-all duration-200 group">
                <Calendar className="h-8 w-8 mx-auto mb-3 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700">Mark Attendance</span>
              </a>

              <a href="/notices" className="p-6 text-center border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-warning-50 hover:to-yellow-50 hover:border-warning-200 transition-all duration-200 group">
                <Bell className="h-8 w-8 mx-auto mb-3 text-warning-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700">Post Notice</span>
              </a>
              <a href="/analytics" className="p-6 text-center border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:border-purple-200 transition-all duration-200 group">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700">View Analytics</span>
              </a>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard