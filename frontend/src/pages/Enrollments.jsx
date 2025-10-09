import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Users, BookOpen, Plus, Trash2, UserPlus, Edit, X } from 'lucide-react'
import toast from 'react-hot-toast'

const Enrollments = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState(null)
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    semester: 'I',
    year: new Date().getFullYear()
  })
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [filters, setFilters] = useState({
    courseId: '',
    studentId: ''
  })

  const { data: enrollmentData, isLoading } = useQuery(
    ['enrollments', filters], 
    async () => {
      const params = new URLSearchParams()
      if (filters.courseId) params.append('courseId', filters.courseId)
      if (filters.studentId) params.append('studentId', filters.studentId)
      
      const response = await axios.get(`/api/enrollments?${params}`)
      return response.data
    }
  )

  const enrollments = enrollmentData?.enrollments || []
  const stats = enrollmentData?.stats || { totalEnrollments: 0, totalStudents: 0, totalCourses: 0 }

  const { data: students } = useQuery('students', async () => {
    const response = await axios.get('/api/users?role=STUDENT')
    return response.data
  })

  const { data: availableStudents } = useQuery(
    ['available-students', formData.courseId],
    async () => {
      if (!formData.courseId) return []
      const response = await axios.get(`/api/enrollments/available-students/${formData.courseId}`)
      return response.data
    },
    { enabled: !!formData.courseId && !editingEnrollment }
  )

  const { data: courses } = useQuery('courses', async () => {
    const response = await axios.get('/api/courses')
    return response.data
  })

  const enrollMutation = useMutation(
    (enrollData) => axios.post('/api/enrollments', enrollData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('enrollments')
        resetForm()
        toast.success('Student enrolled successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to enroll student')
      }
    }
  )

  const updateEnrollmentMutation = useMutation(
    ({ id, ...data }) => axios.put(`/api/enrollments/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('enrollments')
        resetForm()
        toast.success('Enrollment updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update enrollment')
      }
    }
  )

  const unenrollMutation = useMutation(
    (id) => axios.delete(`/api/enrollments/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('enrollments')
        toast.success('Student unenrolled successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to unenroll student')
      }
    }
  )

  const resetForm = () => {
    setShowEnrollForm(false)
    setEditingEnrollment(null)
    setFormData({ studentId: '', courseId: '', semester: 'I', year: new Date().getFullYear() })
    setSelectedStudents([])
    setSelectAll(false)
  }

  // Reset selected students when course changes
  useEffect(() => {
    if (!editingEnrollment) {
      setSelectedStudents([])
      setSelectAll(false)
    }
  }, [formData.courseId, editingEnrollment])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(availableStudents?.map(s => s.id) || [])
    }
    setSelectAll(!selectAll)
  }

  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
    setSelectAll(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingEnrollment) {
      updateEnrollmentMutation.mutate({ id: editingEnrollment.id, ...formData })
    } else {
      if (selectedStudents.length === 0) {
        toast.error('Please select at least one student')
        return
      }
      
      // Enroll multiple students
      selectedStudents.forEach(studentId => {
        enrollMutation.mutate({
          studentId,
          courseId: formData.courseId,
          semester: formData.semester,
          year: formData.year
        })
      })
    }
  }

  const handleEdit = (enrollment) => {
    setEditingEnrollment(enrollment)
    setFormData({
      studentId: enrollment.user.id,
      courseId: enrollment.course.id,
      semester: enrollment.semester,
      year: enrollment.year
    })
    setShowEnrollForm(true)
  }

  const handleUnenroll = (id) => {
    if (window.confirm('Are you sure you want to unenroll this student?')) {
      unenrollMutation.mutate(id)
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-gray-600">Manage student course enrollments</p>
        </div>
        {(user.role === 'ADMIN' || user.role === 'FACULTY') && (
          <button
            onClick={() => setShowEnrollForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Enroll Student
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEnrollments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-100">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Filter Enrollments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Filter by Course</label>
            <select
              className="form-input"
              value={filters.courseId}
              onChange={(e) => setFilters({...filters, courseId: e.target.value})}
            >
              <option value="">All Courses</option>
              {courses?.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Filter by Student</label>
            <select
              className="form-input"
              value={filters.studentId}
              onChange={(e) => setFilters({...filters, studentId: e.target.value})}
            >
              <option value="">All Students</option>
              {students?.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ courseId: '', studentId: '' })}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enroll/Edit Student Form */}
      {showEnrollForm && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEnrollment ? 'Edit Enrollment' : 'Enroll Student in Course'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Select Students</label>
                  {!editingEnrollment ? (
                    <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {!formData.courseId ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          Please select a course first to see available students
                        </p>
                      ) : availableStudents?.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          All students are already enrolled in this course
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center mb-2 pb-2 border-b">
                            <input
                              type="checkbox"
                              id="selectAll"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="mr-2"
                            />
                            <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                              Select All ({availableStudents?.length || 0} available students)
                            </label>
                          </div>
                          {availableStudents?.map(student => (
                            <div key={student.id} className="flex items-center mb-1">
                              <input
                                type="checkbox"
                                id={`student-${student.id}`}
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleStudentSelect(student.id)}
                                className="mr-2"
                              />
                              <label htmlFor={`student-${student.id}`} className="text-sm text-gray-700">
                                {student.firstName} {student.lastName} ({student.studentId})
                              </label>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      required
                      disabled
                    >
                      <option value="">Choose a student</option>
                      {students?.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.studentId})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="form-label">Select Course</label>
                  <select
                    className="form-input"
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    required
                    disabled={editingEnrollment}
                  >
                    <option value="">Choose a course</option>
                    {courses?.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Semester</label>
                  <select
                    className="form-input"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  >
                    <option value="I">Semester I</option>
                    <option value="II">Semester II</option>
                    <option value="III">Semester III</option>
                    <option value="IV">Semester IV</option>
                    <option value="V">Semester V</option>
                    <option value="VI">Semester VI</option>
                    <option value="VII">Semester VII</option>
                    <option value="VIII">Semester VIII</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {editingEnrollment ? 'Update Enrollment' : `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollments List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Enrollments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrollments?.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.user.firstName} {enrollment.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.user.studentId} {enrollment.user.section && `• Section ${enrollment.user.section}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.course.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.course.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.semester?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.user.year ? `${enrollment.user.year}${enrollment.user.year === 1 ? 'st' : enrollment.user.year === 2 ? 'nd' : enrollment.user.year === 3 ? 'rd' : 'th'} Year` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(enrollment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Enrollment"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUnenroll(enrollment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Unenroll Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {enrollments?.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
          <p className="text-gray-600">Start by enrolling students in courses.</p>
        </div>
      )}
    </div>
  )
}

export default Enrollments