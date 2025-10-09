import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react'

const StudentAttendanceCalendar = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCourse, setSelectedCourse] = useState('')

  const { data: courses } = useQuery('student-courses', async () => {
    const response = await axios.get('/api/courses')
    return Array.isArray(response.data) ? response.data : response.data.courses || []
  })

  const { data: attendanceData } = useQuery(
    ['student-calendar-attendance', currentDate.getMonth() + 1, currentDate.getFullYear(), selectedCourse],
    async () => {
      const params = new URLSearchParams({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        studentId: user.id
      })
      if (selectedCourse) params.append('courseId', selectedCourse)
      
      const response = await axios.get(`/api/attendance/calendar?${params}`)
      return response.data
    }
  )

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

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

  const getAttendanceForDay = (day) => {
    if (!day || !attendanceData) return []
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return attendanceData.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0]
      return recordDate === dateStr
    })
  }

  const getDayStatus = (day) => {
    const dayAttendance = getAttendanceForDay(day)
    if (dayAttendance.length === 0) return 'no-class'
    
    const hasAbsent = dayAttendance.some(record => record.status === 'ABSENT')
    const hasPresent = dayAttendance.some(record => record.status === 'PRESENT')
    
    if (hasAbsent && hasPresent) return 'mixed'
    if (hasAbsent) return 'absent'
    if (hasPresent) return 'present'
    return 'no-class'
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const days = getDaysInMonth(currentDate)

  // Calculate monthly stats
  const monthlyStats = React.useMemo(() => {
    if (!attendanceData) return { total: 0, present: 0, absent: 0, percentage: 0 }
    
    const total = attendanceData.length
    const present = attendanceData.filter(record => record.status === 'PRESENT').length
    const absent = attendanceData.filter(record => record.status === 'ABSENT').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    
    return { total, present, absent, percentage }
  }, [attendanceData])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance Calendar</h1>
        <p className="text-gray-600">Track your attendance across all courses</p>
      </div>

      {/* Student Info & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500">{user.studentId}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()} Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-green-600">{monthlyStats.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{monthlyStats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Attendance Rate</span>
              <span>{monthlyStats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  monthlyStats.percentage >= 75 ? 'bg-green-500' : 
                  monthlyStats.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${monthlyStats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Filter */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filter by Course</h3>
          <select
            className="form-input w-64"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
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
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-500 text-sm">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const dayStatus = day ? getDayStatus(day) : 'empty'
              const dayAttendance = day ? getAttendanceForDay(day) : []
              
              return (
                <div
                  key={index}
                  className={`p-3 min-h-[80px] border border-gray-200 relative ${
                    day ? 'hover:bg-gray-50' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        {day}
                      </div>
                      
                      {/* Status indicator */}
                      {dayStatus === 'present' && (
                        <div className="w-full h-3 bg-green-500 rounded mb-1"></div>
                      )}
                      {dayStatus === 'absent' && (
                        <div className="w-full h-3 bg-red-500 rounded mb-1"></div>
                      )}
                      {dayStatus === 'mixed' && (
                        <div className="w-full h-3 bg-gradient-to-r from-green-500 to-red-500 rounded mb-1"></div>
                      )}
                      
                      {/* Course count */}
                      {dayAttendance.length > 0 && (
                        <div className="text-xs text-gray-600">
                          {dayAttendance.length} class{dayAttendance.length !== 1 ? 'es' : ''}
                        </div>
                      )}
                      
                      {/* Course details on hover */}
                      {dayAttendance.length > 0 && (
                        <div className="absolute z-10 invisible group-hover:visible bg-black text-white text-xs rounded p-2 bottom-full left-0 mb-1 whitespace-nowrap">
                          {dayAttendance.map((record, i) => (
                            <div key={i}>
                              {record.course.code}: {record.status}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Present (All classes)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Absent (All classes)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Mixed (Some present, some absent)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentAttendanceCalendar