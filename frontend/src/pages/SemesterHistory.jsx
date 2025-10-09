import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Calendar, Users, BookOpen, BarChart3, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'

const SemesterHistory = () => {
  const { user } = useAuth()
  const [selectedSemester, setSelectedSemester] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedStudents, setExpandedStudents] = useState({})

  const { data, isLoading } = useQuery(
    ['semester-history', selectedSemester, yearFilter, sectionFilter],
    async () => {
      const params = new URLSearchParams()
      if (selectedSemester) params.append('semesterId', selectedSemester)
      if (yearFilter) params.append('year', yearFilter)
      if (sectionFilter) params.append('section', sectionFilter)
      
      const response = await axios.get(`/api/users/semester-history?${params}`)
      return response.data
    }
  )

  const filteredStudents = data?.students?.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower)
    )
    
    // Filter by selected semester if specified
    const matchesSemester = !selectedSemester || Object.keys(student.semesterData).includes(selectedSemester)
    
    return matchesSearch && matchesSemester
  }) || []

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-7 w-7 mr-3 text-primary-600" />
          Semester History
        </h1>
        <p className="text-gray-600 mt-1">View all students' semester-wise academic progress and attendance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name or Student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Semesters</option>
              {data?.semesters?.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name} ({semester.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admission Year-wise Students List */}
      {(() => {
        const studentsByAdmissionYear = filteredStudents.reduce((acc, student) => {
          // Calculate admission year based on current year and student year
          const currentYear = new Date().getFullYear()
          const admissionYear = student.year ? currentYear - (student.year - 1) : currentYear
          
          if (!acc[admissionYear]) acc[admissionYear] = []
          acc[admissionYear].push(student)
          return acc
        }, {})
        
        return Object.entries(studentsByAdmissionYear)
          .sort(([a], [b]) => b - a) // Sort by admission year descending
          .map(([admissionYear, students]) => (
            <div key={admissionYear} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary-600" />
                  {admissionYear} Batch Students ({students.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">Students admitted in {admissionYear}</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {students.map((student) => {
                  const isExpanded = expandedStudents[student.id]
                  const semesterIds = Object.keys(student.semesterData)
                  
                  return (
                    <div key={student.id} className="p-6">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleStudentExpansion(student.id)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-primary-100 rounded-lg mr-4">
                            <Users className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {student.studentId} • Year {student.year} • Section {student.section}
                            </p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-4">
                            {semesterIds.length} Semesters
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 grid gap-4">
                          {Object.entries(student.semesterData)
                            .sort(([,a], [,b]) => new Date(a.semester.startDate) - new Date(b.semester.startDate))
                            .map(([semesterId, semesterInfo]) => {
                              const isCompleted = new Date(semesterInfo.semester.endDate) < new Date()
                              
                              return (
                                <div key={semesterId} className={`p-4 rounded-lg border ${
                                  isCompleted ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                                }`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h4 className="font-medium text-gray-900">
                                        {semesterInfo.semester.name}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {semesterInfo.semester.code} • {new Date(semesterInfo.semester.startDate).toLocaleDateString()} - {new Date(semesterInfo.semester.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isCompleted ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {isCompleted ? 'Completed' : 'Current'}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                    <div className="bg-white rounded p-3">
                                      <div className="flex items-center">
                                        <BarChart3 className="h-4 w-4 text-gray-600 mr-2" />
                                        <div>
                                          <p className="text-xs text-gray-600">Attendance</p>
                                          <p className="font-bold text-gray-900">
                                            {semesterInfo.attendanceStats.attendancePercentage}%
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-white rounded p-3">
                                      <p className="text-xs text-gray-600">Present</p>
                                      <p className="font-bold text-green-600">
                                        {semesterInfo.attendanceStats.presentClasses}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-white rounded p-3">
                                      <p className="text-xs text-gray-600">Absent</p>
                                      <p className="font-bold text-red-600">
                                        {semesterInfo.attendanceStats.absentClasses}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-white rounded p-3">
                                      <p className="text-xs text-gray-600">Total</p>
                                      <p className="font-bold text-blue-600">
                                        {semesterInfo.attendanceStats.totalClasses}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs font-medium text-gray-700 mb-2">Courses ({semesterInfo.courses.length})</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      {semesterInfo.courses.map((course, idx) => (
                                        <div key={idx} className="bg-white rounded p-2">
                                          <p className="text-xs font-medium text-gray-900">{course.name}</p>
                                          <p className="text-xs text-gray-600">{course.code} • {course.credits} credits</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
      })()}

      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SemesterHistory