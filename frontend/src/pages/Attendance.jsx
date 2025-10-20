import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Calendar, CheckCircle, XCircle, Clock, Users, BookOpen, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const Attendance = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceData, setAttendanceData] = useState({})

  // Get courses for faculty
  const { data: courses } = useQuery('courses', async () => {
    const response = await axios.get('/api/courses')
    return response.data
  })

  // Get enrolled students for selected course (Faculty) or faculty members (Admin)
  const { data: students } = useQuery(
    ['course-students', selectedCourse, user.role],
    async () => {
      if (user.role === 'ADMIN') {
        // Admin gets faculty members directly
        const response = await axios.get('/api/users?role=FACULTY')
        return response.data
      } else {
        // Faculty gets students for selected course
        const response = await axios.get(`/api/courses/${selectedCourse}/students`)
        return response.data
      }
    },
    { enabled: user.role === 'ADMIN' || !!selectedCourse }
  )

  // Auto-mark all students as PRESENT when students load
  React.useEffect(() => {
    if (students && students.length > 0) {
      const defaultAttendance = {}
      students.forEach(student => {
        defaultAttendance[student.id] = 'PRESENT'
      })
      setAttendanceData(defaultAttendance)
    }
  }, [students])

  // Get attendance for student
  const { data: studentAttendance } = useQuery(
    ['attendance', user.id],
    async () => {
      const response = await axios.get(`/api/attendance/student/${user.id}`)
      return response.data
    },
    { enabled: user.role === 'STUDENT' }
  )

  // Mark attendance mutation
  const markAttendanceMutation = useMutation(
    (attendanceList) => axios.post('/api/attendance/mark', {
      courseId: selectedCourse,
      date: selectedDate,
      attendance: attendanceList
    }),
    {
      onSuccess: (response, variables) => {
        const presentCount = variables.filter(a => a.status === 'PRESENT').length
        const absentCount = variables.filter(a => a.status === 'ABSENT').length
        const lateCount = variables.filter(a => a.status === 'LATE').length
        const totalMarked = variables.length
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['attendance'])
        queryClient.invalidateQueries(['attendance-calendar'])
        queryClient.invalidateQueries(['attendance-report'])
        
        // Success feedback with details
        toast.success(
          `✅ Attendance marked for ${totalMarked} students!\n✅ Present: ${presentCount} | ❌ Absent: ${absentCount} | ⏰ Late: ${lateCount}`,
          { duration: 4000 }
        )
        // Reset to default PRESENT for all students
        if (students && students.length > 0) {
          const defaultAttendance = {}
          students.forEach(student => {
            defaultAttendance[student.id] = 'PRESENT'
          })
          setAttendanceData(defaultAttendance)
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark attendance')
      }
    }
  )

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmitAttendance = () => {
    if (!selectedCourse || !selectedDate) {
      toast.error('Please select course and date')
      return
    }

    const attendanceList = Object.entries(attendanceData).map(([studentId, status]) => ({
      userId: studentId,
      status
    }))

    if (attendanceList.length === 0) {
      toast.error('Please mark attendance for at least one student')
      return
    }

    const presentCount = attendanceList.filter(a => a.status === 'PRESENT').length
    const absentCount = attendanceList.filter(a => a.status === 'ABSENT').length
    const lateCount = attendanceList.filter(a => a.status === 'LATE').length
    const totalMarked = attendanceList.length

    // Show confirmation with summary
    const confirmMessage = `Mark attendance for ${totalMarked} students?\n\n✅ Present: ${presentCount}\n❌ Absent: ${absentCount}\n⏰ Late: ${lateCount}`
    
    if (window.confirm(confirmMessage)) {
      markAttendanceMutation.mutate(attendanceList)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'ABSENT':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'LATE':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">
          {user.role === 'STUDENT' ? 'Track your class attendance' : 
           user.role === 'ADMIN' ? 'Mark faculty attendance' : 'Mark student attendance'}
        </p>
      </div>

      {/* Faculty/Admin Attendance Marking */}
      {(user.role === 'FACULTY' || user.role === 'ADMIN') && (
        <div className="card">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Mark Attendance</h2>
            
            {/* Course and Date Selection */}
            <div className={`grid ${user.role === 'ADMIN' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
              {user.role !== 'ADMIN' && (
                <div>
                  <label className="form-label">Select Course</label>
                  <select
                    className="form-input"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">Choose a course</option>
                    {courses?.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Students/Faculty List for Attendance */}
            {((user.role === 'ADMIN' && students) || (selectedCourse && students)) && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">
                    {user.role === 'ADMIN' ? `Faculty Members (${students.length})` : `Enrolled Students (${students.length})`}
                  </h3>
                  <div className="text-sm text-gray-600">
                    ✅ All {user.role === 'ADMIN' ? 'faculty' : 'students'} marked PRESENT by default
                  </div>
                </div>
                <div className="space-y-3">
                  {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">ID: {student.studentId || student.employeeId}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleAttendanceChange(student.id, status)}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                              attendanceData[student.id] === status
                                ? status === 'PRESENT' ? 'bg-green-600 text-white'
                                  : status === 'ABSENT' ? 'bg-red-600 text-white'
                                  : 'bg-yellow-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {Object.keys(attendanceData).length > 0 && (
                      <span>
                        Marked: {Object.keys(attendanceData).length} students |
                        ✅ {Object.values(attendanceData).filter(s => s === 'PRESENT').length} |
                        ❌ {Object.values(attendanceData).filter(s => s === 'ABSENT').length} |
                        ⏰ {Object.values(attendanceData).filter(s => s === 'LATE').length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSubmitAttendance}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    disabled={markAttendanceMutation.isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {markAttendanceMutation.isLoading ? 'Marking...' : 'Mark Attendance'}
                  </button>
                </div>
                
                {students.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>{user.role === 'ADMIN' ? 'No faculty members found' : 'No students enrolled in this course'}</p>
                    <p className="text-sm">{user.role === 'ADMIN' ? 'Go to Faculty page to add faculty' : 'Go to Enrollments page to add students'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Attendance View */}
      {user.role === 'STUDENT' && studentAttendance && (
        <>
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentAttendance.stats?.totalClasses || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentAttendance.stats?.presentClasses || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Absent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentAttendance.stats?.absentClasses || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">%</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Percentage</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentAttendance.stats?.attendancePercentage || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Attendance Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentAttendance.attendance?.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.course?.name || 'Unknown Course'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.course?.code || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Attendance