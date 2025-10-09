import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Calendar, BookOpen, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react'

const StudentSemesters = () => {
  const { user } = useAuth()

  const { data: studentDetails, isLoading } = useQuery(
    'student-details',
    async () => {
      const response = await axios.get('/api/users/student-details')
      return response.data
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const allSemesters = [
    ...(studentDetails?.semesterHistory || []),
    ...(studentDetails?.currentSemester ? [studentDetails.currentSemester] : [])
  ].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-7 w-7 mr-3 text-primary-600" />
          My Semesters
        </h1>
        <p className="text-gray-600 mt-1">View your semester-wise academic progress and attendance</p>
      </div>

      {allSemesters.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Semesters Found</h3>
          <p className="text-gray-600">You haven't been enrolled in any semesters yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {allSemesters.map((semester, index) => {
            const isCompleted = studentDetails?.semesterHistory?.some(s => s.id === semester.id)
            const isCurrent = studentDetails?.currentSemester?.id === semester.id
            
            return (
              <div key={semester.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className={`px-6 py-4 border-b border-gray-200 ${
                  isCurrent ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 
                  isCompleted ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-4 ${
                        isCurrent ? 'bg-green-100' : isCompleted ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Calendar className={`h-5 w-5 ${
                          isCurrent ? 'text-green-600' : isCompleted ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {semester.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {semester.code} • {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isCurrent && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Current
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {semester.attendanceStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Attendance</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {semester.attendanceStats.attendancePercentage}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-600">Present</p>
                            <p className="text-2xl font-bold text-green-900">
                              {semester.attendanceStats.presentClasses}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-600">Absent</p>
                            <p className="text-2xl font-bold text-red-900">
                              {semester.attendanceStats.absentClasses}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-blue-600">Total Classes</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {semester.attendanceStats.totalClasses}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No attendance data available for this semester</p>
                    </div>
                  )}

                  {/* Courses enrolled in this semester */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Enrolled Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {studentDetails?.enrollments
                        ?.filter(enrollment => enrollment.semester?.id === semester.id)
                        ?.map(enrollment => (
                          <div key={enrollment.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-900 text-sm">{enrollment.course.name}</p>
                            <p className="text-xs text-gray-600">{enrollment.course.code} • {enrollment.course.credits} credits</p>
                          </div>
                        )) || (
                        <p className="text-gray-500 text-sm col-span-full">No courses found for this semester</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentSemesters