import React, { useState } from 'react'
import { useQuery } from 'react-query'
import api from '../config/api'
import { useAuth } from '../context/AuthContext'
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'

const AttendanceCalendar = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCourse, setSelectedCourse] = useState('')

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  // Get user's courses
  const { data: courses } = useQuery('user-courses', async () => {
    if (user.role === 'STUDENT') {
      const response = await api.get(`/api/enrollments/student/${user.id}`)
      return response.data.map(e => e.course)
    } else {
      const response = await api.get(`/api/faculty-courses/faculty/${user.id}`)
      return response.data
    }
  })

  // Get attendance data for calendar
  const { data: attendance } = useQuery(
    ['attendance-calendar', month, year, selectedCourse],
    async () => {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString()
      })
      
      if (user.role === 'STUDENT') {
        params.append('studentId', user.id)
      }
      if (selectedCourse) {
        params.append('courseId', selectedCourse)
      }
      
      const response = await api.get(`/api/attendance/calendar?${params}`)
      return response.data
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
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
      case 'PRESENT': return 'text-green-600'
      case 'ABSENT': return 'text-red-600'
      case 'LATE': return 'text-yellow-600'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="h-4 w-4" />
      case 'ABSENT': return <XCircle className="h-4 w-4" />
      case 'LATE': return <Clock className="h-4 w-4" />
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
            <Calendar className="h-6 w-6 mr-2" />
            My Attendance Calendar
          </h1>
          <p className="text-gray-600">Track your attendance across all courses</p>
        </div>
      </div>

      {/* Course Filter */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="form-input w-64"
          >
            <option value="">All Courses</option>
            {courses?.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>
      </div>

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
                className={`min-h-[80px] p-2 border border-gray-200 ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                }`}
              >
                {day && (
                  <>
                    <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                    <div className="space-y-1">
                      {getAttendanceForDate(day).map((record, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center text-xs ${getStatusColor(record.status)}`}
                          title={`${record.course.name}: ${record.status}`}
                        >
                          {getStatusIcon(record.status)}
                          <span className="ml-1 truncate">{record.course.code}</span>
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

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
        <div className="flex space-x-6">
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">Present</span>
          </div>
          <div className="flex items-center text-red-600">
            <XCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">Absent</span>
          </div>
          <div className="flex items-center text-yellow-600">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">Late</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceCalendar