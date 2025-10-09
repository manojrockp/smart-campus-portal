import React, { useState } from 'react'
import { useQuery } from 'react-query'
import api from '../config/api'
import { useAuth } from '../context/AuthContext'
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Users } from 'lucide-react'

const FacultyAttendanceCalendar = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [showOnlyAbsent, setShowOnlyAbsent] = useState(true)

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  // Get faculty's courses
  const { data: courses } = useQuery('faculty-courses', async () => {
    const response = await api.get(`/faculty-courses/faculty/${user.id}`)
    return response.data
  })

  // Get students enrolled in selected course
  const { data: students } = useQuery(
    ['course-students', selectedCourse],
    async () => {
      if (!selectedCourse) return []
      const response = await api.get(`/enrollments/course/${selectedCourse}`)
      return response.data.map(e => e.user)
    },
    { enabled: !!selectedCourse }
  )

  // Get attendance data for calendar
  const { data: attendance } = useQuery(
    ['faculty-attendance-calendar', month, year, selectedCourse, selectedStudent, selectedDate],
    async () => {
      const params = new URLSearchParams()
      
      if (selectedDate) {
        // If specific date selected, get data for that date only
        const date = new Date(selectedDate)
        params.append('month', (date.getMonth() + 1).toString())
        params.append('year', date.getFullYear().toString())
      } else {
        // Otherwise get data for current month
        params.append('month', month.toString())
        params.append('year', year.toString())
      }
      
      if (selectedCourse) params.append('courseId', selectedCourse)
      if (selectedStudent) params.append('studentId', selectedStudent)
      
      const response = await api.get(`/attendance/calendar?${params}`)
      let data = response.data
      
      // Filter by specific date if selected
      if (selectedDate) {
        const dateStr = selectedDate
        data = data.filter(a => a.date.startsWith(dateStr))
      }
      
      // Filter to show only absent students if enabled
      if (showOnlyAbsent) {
        data = data.filter(a => a.status === 'ABSENT')
      }
      
      return data
    }
  )

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const getAttendanceForDate = (day) => {
    if (!day || !attendance) return []
    
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return attendance.filter(a => a.date.startsWith(dateStr))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="h-3 w-3" />
      case 'ABSENT': return <XCircle className="h-3 w-3" />
      case 'LATE': return <Clock className="h-3 w-3" />
      default: return null
    }
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Student Attendance Calendar
          </h1>
          <p className="text-gray-600">Track attendance for all students in your courses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Course:</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value)
                setSelectedStudent('')
              }}
              className="form-input w-full"
            >
              <option value="">Select Course</option>
              {courses?.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Student (Optional):</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="form-input w-full"
              disabled={!selectedCourse}
            >
              <option value="">All Students</option>
              {students?.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Specific Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Show:</label>
            <select
              value={showOnlyAbsent ? 'absent' : 'all'}
              onChange={(e) => setShowOnlyAbsent(e.target.value === 'absent')}
              className="form-input w-full"
            >
              <option value="absent">Absent Only</option>
              <option value="all">All Students</option>
            </select>
          </div>
        </div>
        {selectedDate && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Showing data for: {new Date(selectedDate).toLocaleDateString()}</span>
            <button
              onClick={() => setSelectedDate('')}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Clear Date Filter
            </button>
          </div>
        )}
      </div>

      {selectedCourse && (
        <>
          {/* Calendar */}
          <div className="card">
            <div className="p-6">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-200 ${
                      day ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {day && (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-2">{day}</div>
                        <div className="space-y-1">
                          {getAttendanceForDate(day).map((record, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center text-xs px-2 py-1 rounded ${getStatusColor(record.status)}`}
                              title={`${record.user.firstName} ${record.user.lastName}: ${record.status}`}
                            >
                              {getStatusIcon(record.status)}
                              <span className="ml-1 truncate">
                                {selectedStudent ? record.course.code : record.user.firstName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {attendance && attendance.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <div className="text-2xl font-bold text-red-600">
                  {attendance.filter(a => a.status === 'ABSENT').length}
                </div>
                <div className="text-sm text-gray-600">Absent Students</div>
              </div>
              <div className="card p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {attendance.filter(a => a.status === 'LATE').length}
                </div>
                <div className="text-sm text-gray-600">Late Students</div>
              </div>
              <div className="card p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {attendance.length}
                </div>
                <div className="text-sm text-gray-600">{showOnlyAbsent ? 'Total Absent' : 'Total Records'}</div>
              </div>
            </div>
          )}
          
          {/* Absent Students List for specific date */}
          {selectedDate && attendance && attendance.length > 0 && (
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-red-600">
                  {showOnlyAbsent ? 'Absent' : 'All'} Students on {new Date(selectedDate).toLocaleDateString()}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {attendance.map((record, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.user.firstName} {record.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.user.studentId} • {record.course.name}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedCourse && (
        <div className="card p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
          <p className="text-gray-600">Choose a course to view attendance calendar</p>
          <p className="text-sm text-red-600 mt-2">Currently showing: {showOnlyAbsent ? 'Absent students only' : 'All students'}</p>
        </div>
      )}

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Present
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Absent
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Late
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyAttendanceCalendar