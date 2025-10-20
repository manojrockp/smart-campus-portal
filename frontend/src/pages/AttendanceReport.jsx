import React, { useState } from 'react'
import { useQuery } from 'react-query'
import api from '../config/api'
import { useAuth } from '../context/AuthContext'
import { BarChart3, PieChart, Calendar, Download, Filter } from 'lucide-react'

const AttendanceReport = () => {
  const { user } = useAuth()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '2025-10-01',
    endDate: '2025-10-31'
  })

  // Get courses based on user role
  const { data: courses, error: coursesError } = useQuery('report-courses', async () => {
    try {
      if (user.role === 'STUDENT') {
        const response = await api.get(`/api/enrollments/student/${user.id}`)
        return response.data.map(e => e.course)
      } else if (user.role === 'FACULTY') {
        const response = await api.get(`/api/faculty-courses/faculty/${user.id}`)
        return response.data
      } else {
        // Admin - get all courses
        const response = await api.get('/api/courses')
        return response.data
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      return []
    }
  })

  // Get students enrolled in selected course (for faculty/admin)
  const { data: students } = useQuery(
    ['course-students', selectedCourse],
    async () => {
      if (!selectedCourse || user.role === 'STUDENT') return []
      const response = await api.get(`/api/enrollments/course/${selectedCourse}`)
      return response.data.map(e => e.user)
    },
    { enabled: !!selectedCourse && user.role !== 'STUDENT' }
  )

  // Get attendance data for reports
  const { data: reportData, isLoading, error: reportError } = useQuery(
    ['attendance-report', selectedCourse, selectedStudent, dateRange],
    async () => {
      try {
        const params = new URLSearchParams()
        if (selectedCourse) params.append('courseId', selectedCourse)
        
        // Add student filter
        if (user.role === 'STUDENT') {
          params.append('studentId', user.id)
        } else if (selectedStudent) {
          params.append('studentId', selectedStudent)
        }
        
        console.log('Fetching attendance with params:', params.toString())
        const response = await api.get(`/api/attendance/calendar?${params}`)
        const data = response.data || []
        
        // Filter by date range
        const filtered = data.filter(record => {
          const recordDate = record.date.split('T')[0]
          return recordDate >= dateRange.startDate && recordDate <= dateRange.endDate
        })
        
        return processAttendanceData(filtered)
      } catch (error) {
        console.error('Error fetching attendance data:', error)
        return processAttendanceData([])
      }
    },
    { 
      enabled: !!selectedCourse,
      retry: false,
      onError: (error) => {
        console.error('Query error:', error)
      }
    }
  )

  const processAttendanceData = (data) => {
    const statusCounts = {
      PRESENT: data.filter(r => r.status === 'PRESENT').length,
      ABSENT: data.filter(r => r.status === 'ABSENT').length,
      LATE: data.filter(r => r.status === 'LATE').length
    }

    const total = statusCounts.PRESENT + statusCounts.ABSENT + statusCounts.LATE
    const attendanceRate = total > 0 ? ((statusCounts.PRESENT + statusCounts.LATE) / total * 100).toFixed(1) : 0

    // Daily attendance trends
    const dailyData = {}
    data.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { PRESENT: 0, ABSENT: 0, LATE: 0 }
      }
      dailyData[date][record.status]++
    })

    const dailyTrends = Object.entries(dailyData).map(([date, counts]) => ({
      date,
      ...counts,
      total: counts.PRESENT + counts.ABSENT + counts.LATE,
      rate: ((counts.PRESENT + counts.LATE) / (counts.PRESENT + counts.ABSENT + counts.LATE) * 100).toFixed(1)
    })).sort((a, b) => new Date(a.date) - new Date(b.date))

    return {
      statusCounts,
      attendanceRate,
      dailyTrends,
      totalRecords: total
    }
  }

  const PieChartComponent = ({ data }) => {
    const total = data.PRESENT + data.ABSENT + data.LATE
    if (total === 0) return <div className="text-gray-500">No data available</div>

    const segments = [
      { label: 'Present', value: data.PRESENT, color: '#10B981', percentage: (data.PRESENT / total * 100).toFixed(1) },
      { label: 'Absent', value: data.ABSENT, color: '#EF4444', percentage: (data.ABSENT / total * 100).toFixed(1) },
      { label: 'Late', value: data.LATE, color: '#F59E0B', percentage: (data.LATE / total * 100).toFixed(1) }
    ]

    return (
      <div className="flex items-center justify-center space-x-8">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {segments.reduce((acc, segment, index) => {
              const prevPercentage = segments.slice(0, index).reduce((sum, s) => sum + parseFloat(s.percentage), 0)
              const strokeDasharray = `${segment.percentage} ${100 - segment.percentage}`
              const strokeDashoffset = -prevPercentage
              
              acc.push(
                <circle
                  key={segment.label}
                  cx="50"
                  cy="50"
                  r="15.915"
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              )
              return acc
            }, [])}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {segments.map(segment => (
            <div key={segment.label} className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: segment.color }}></div>
              <span className="text-sm font-medium">{segment.label}</span>
              <span className="text-sm text-gray-600">
                {segment.value} ({segment.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const BarChartComponent = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>

    const maxValue = Math.max(...data.map(d => d.total))
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Daily Attendance Trends</span>
          <span>Max: {maxValue} students</span>
        </div>
        <div className="space-y-2">
          {data.slice(-10).map((day, index) => (
            <div key={day.date} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{new Date(day.date).toLocaleDateString()}</span>
                <span>{day.rate}% attendance</span>
              </div>
              <div className="flex space-x-1 h-6">
                <div 
                  className="bg-green-500 rounded-l"
                  style={{ width: `${(day.PRESENT / maxValue) * 100}%` }}
                  title={`Present: ${day.PRESENT}`}
                ></div>
                <div 
                  className="bg-yellow-500"
                  style={{ width: `${(day.LATE / maxValue) * 100}%` }}
                  title={`Late: ${day.LATE}`}
                ></div>
                <div 
                  className="bg-red-500 rounded-r"
                  style={{ width: `${(day.ABSENT / maxValue) * 100}%` }}
                  title={`Absent: ${day.ABSENT}`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          Attendance Reports & Analytics
        </h1>
        <p className="text-gray-600">Comprehensive attendance analysis with visual insights</p>
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
                setSelectedStudent('') // Reset student when course changes
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
          
          {/* Student Filter - Only show for Faculty/Admin */}
          {user.role !== 'STUDENT' && (
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
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">End Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="form-input w-full"
            />
          </div>
        </div>
        
        {/* Show selected filters */}
        {(selectedCourse || selectedStudent) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCourse && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Course: {courses?.find(c => c.id === selectedCourse)?.name}
              </span>
            )}
            {selectedStudent && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Student: {students?.find(s => s.id === selectedStudent)?.firstName} {students?.find(s => s.id === selectedStudent)?.lastName}
              </span>
            )}
          </div>
        )}
      </div>

      {selectedCourse && reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-2xl font-bold text-green-600">{reportData.statusCounts.PRESENT}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-red-600">{reportData.statusCounts.ABSENT}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-yellow-600">{reportData.statusCounts.LATE}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-blue-600">{reportData.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Attendance Distribution
                </h3>
              </div>
              <div className="p-6">
                <PieChartComponent data={reportData.statusCounts} />
              </div>
            </div>

            {/* Bar Chart */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Daily Trends (Last 10 Days)
                </h3>
              </div>
              <div className="p-6">
                <BarChartComponent data={reportData.dailyTrends} />
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Daily Attendance Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.dailyTrends.map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{day.PRESENT}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{day.ABSENT}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{day.LATE}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}



      {!selectedCourse && (
        <div className="card p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
          <p className="text-gray-600">Choose a course to generate attendance reports and analytics</p>
          {courses && courses.length === 0 && (
            <p className="text-red-600 mt-2">No courses found. Make sure you are enrolled in courses or have courses assigned.</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  )
}

export default AttendanceReport