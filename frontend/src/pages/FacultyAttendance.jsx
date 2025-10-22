import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Calendar, CheckCircle, XCircle, Clock, Users, Filter } from 'lucide-react'

const FacultyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState('')

  // Get all faculty members
  const { data: faculty } = useQuery('faculty', async () => {
    const response = await axios.get('/api/users?role=FACULTY')
    return response.data
  })

  // Get faculty attendance
  const { data: attendance, isLoading } = useQuery(
    ['faculty-attendance', selectedDate, selectedFaculty],
    async () => {
      const params = new URLSearchParams()
      if (selectedDate) params.append('date', selectedDate)
      if (selectedFaculty) params.append('facultyId', selectedFaculty)
      
      const response = await axios.get(`/api/attendance/faculty?${params}`)
      return response.data
    }
  )

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
        <h1 className="text-2xl font-bold text-gray-900">Faculty Attendance</h1>
        <p className="text-gray-600">View and track faculty attendance records</p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Filter by Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">Filter by Faculty</label>
            <select
              className="form-input"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
            >
              <option value="">All Faculty</option>
              {faculty?.map(member => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} ({member.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Attendance Records</h2>
            <div className="text-sm text-gray-500">
              {attendance?.length || 0} records found
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading attendance records...</p>
          </div>
        ) : attendance && attendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marked At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.user.firstName} {record.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.user.employeeId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
            <p className="text-gray-500">
              {selectedDate || selectedFaculty 
                ? 'Try adjusting your filters to see more records.'
                : 'Faculty attendance records will appear here once marked.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FacultyAttendance