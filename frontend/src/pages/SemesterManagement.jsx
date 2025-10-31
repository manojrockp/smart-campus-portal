import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../config/api'
import { Calendar, Plus, Edit, Trash2, CheckCircle, Clock, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const SemesterManagement = () => {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [expandedSemester, setExpandedSemester] = useState(null)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [selectedSemesterId, setSelectedSemesterId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'ODD', // Default to ODD
    year: new Date().getFullYear(),
    startDate: '',
    endDate: ''
  })
  const [activeYear, setActiveYear] = useState(null)

  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: ''
  })

  // Get all semesters grouped by year
  const { data: semesters, isLoading } = useQuery(
    ['semesters', filterYear], 
    async () => {
      const params = filterYear ? `?year=${filterYear}` : ''
      const response = await api.get(`/api/semesters${params}`)
      return response.data
    }
  )

  // Get academic years
  const { data: academicYears } = useQuery('academicYears', async () => {
    const response = await api.get('/api/semesters/years')
    return response.data
  })

  // Get active year
  const { data: activeYearData } = useQuery('activeYear', async () => {
    const activeYear = await api.get('/api/semesters/years')
    return activeYear.data.find(y => y.isActive)
  })

  // Get courses for expanded semester
  const { data: semesterCourses } = useQuery(
    ['courses', expandedSemester],
    async () => {
      if (!expandedSemester) return []
      const response = await api.get(`/api/courses/semester/${expandedSemester}`)
      return response.data
    },
    { enabled: !!expandedSemester }
  )

  // Create/Update semester
  const saveMutation = useMutation(
    async (data) => {
      if (editingSemester) {
        return await api.put(`/api/semesters/${editingSemester.id}`, data)
      } else {
        return await api.post('/api/semesters', data)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('semesters')
        setShowForm(false)
        setEditingSemester(null)
        resetForm()
        toast.success(editingSemester ? 'Semester updated!' : 'Semester created!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Operation failed')
      }
    }
  )

  // Delete semester
  const deleteMutation = useMutation(
    async (id) => await api.delete(`/api/semesters/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('semesters')
        toast.success('Semester deleted!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Delete failed')
      }
    }
  )

  // Activate year
  const activateYearMutation = useMutation(
    async (year) => await api.post(`/api/semesters/years/${year}/activate`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('academicYears')
        queryClient.invalidateQueries('activeYear')
        queryClient.invalidateQueries('semesters')
        toast.success('Academic year activated!')
      },
      onError: (error) => {
        console.error('Activation error:', error)
        toast.error(error.response?.data?.message || 'Activation failed')
      }
    }
  )

  // Create course
  const createCourseMutation = useMutation(
    async (courseData) => await api.post('/api/courses', { ...courseData, semesterId: selectedSemesterId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses', expandedSemester])
        queryClient.invalidateQueries('semesters')
        setShowCourseForm(false)
        setCourseFormData({ name: '', code: '', description: '', credits: '' })
        toast.success('Course created!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Course creation failed')
      }
    }
  )

  // Delete course
  const deleteCourseMutation = useMutation(
    async (courseId) => await api.delete(`/api/courses/${courseId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['courses', expandedSemester])
        queryClient.invalidateQueries('semesters')
        toast.success('Course deleted!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Course deletion failed')
      }
    }
  )

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'ODD',
      year: new Date().getFullYear(),
      startDate: '',
      endDate: ''
    })
  }

  const handleEdit = (semester) => {
    setEditingSemester(semester)
    setFormData({
      name: semester.name,
      code: semester.code,
      type: semester.type || 'ODD',
      year: semester.year,
      startDate: semester.startDate.split('T')[0],
      endDate: semester.endDate.split('T')[0]
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate dates
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    
    if (startDate >= endDate) {
      toast.error('End date must be after start date')
      return
    }
    
    // Check for duplicate semester in same year
    const duplicate = semesters?.find(sem => {
      if (editingSemester && sem.id === editingSemester.id) return false
      return sem.year === formData.year && (sem.name === formData.name || sem.code === formData.code)
    })
    
    if (duplicate) {
      toast.error(`Semester "${duplicate.name}" already exists in ${formData.year}`)
      return
    }
    
    // Check for overlapping semesters
    const overlapping = semesters?.find(sem => {
      if (editingSemester && sem.id === editingSemester.id) return false
      const semStart = new Date(sem.startDate)
      const semEnd = new Date(sem.endDate)
      return (startDate <= semEnd && endDate >= semStart)
    })
    
    if (overlapping) {
      toast.error(`Dates overlap with ${overlapping.name}`)
      return
    }
    
    saveMutation.mutate(formData)
  }

  const handleDelete = (semester) => {
    if (window.confirm(`Delete semester "${semester.name}"?`)) {
      deleteMutation.mutate(semester.id)
    }
  }

  const handleCourseSubmit = (e) => {
    e.preventDefault()
    createCourseMutation.mutate(courseFormData)
  }

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('Delete this course?')) {
      deleteCourseMutation.mutate(courseId)
    }
  }

  const toggleSemesterExpansion = (semesterId) => {
    if (expandedSemester === semesterId) {
      setExpandedSemester(null)
    } else {
      setExpandedSemester(semesterId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            Semester Management
          </h1>
          <p className="text-gray-600">Manage academic semesters and time periods</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">View Year:</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="form-input py-2 px-3 text-sm min-w-[120px]"
            >
              <option value="">All Years</option>
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() + i - 2;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => {
              setShowForm(true)
              setEditingSemester(null)
              resetForm()
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Semester
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingSemester ? 'Edit Semester' : 'Add New Semester'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Semester Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="e.g., Fall 2025"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Semester Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="form-input"
                    placeholder="e.g., FALL2025"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Semester Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="ODD">ODD (Semesters 1, 3, 5)</option>
                    <option value="EVEN">EVEN (Semesters 2, 4, 6)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn-primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : (editingSemester ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSemester(null)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semesters List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Academic Semesters</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : semesters?.length > 0 ? (
            <div className="space-y-4">
              {semesters.map((semester) => (
                <div key={semester.id} className="border border-gray-200 rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleSemesterExpansion(semester.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedSemester === semester.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className={`p-2 rounded-lg ${activeYearData?.year === semester.year ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {activeYearData?.year === semester.year ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center">
                            {semester.name}
                            {activeYearData?.year === semester.year && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Active Year
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {semester.code} • {semester.type || 'N/A'} • Year {semester.year} • {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {semester._count.courses} courses • {semester._count.enrollments} enrollments
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activeYearData?.year !== semester.year && (
                          <button
                            onClick={() => activateYearMutation.mutate(semester.year)}
                            className="text-green-600 hover:text-green-800 text-sm"
                            disabled={activateYearMutation.isLoading}
                          >
                            Set Active Year
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSemesterId(semester.id)
                            setShowCourseForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Add Course
                        </button>
                        <button
                          onClick={() => handleEdit(semester)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(semester)}
                          className="text-red-600 hover:text-red-800"
                          disabled={semester._count.enrollments > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Courses Section */}
                  {expandedSemester === semester.id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Courses in {semester.name}
                      </h5>
                      {semesterCourses?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {semesterCourses.map((course) => (
                            <div key={course.id} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h6 className="font-medium text-gray-900">{course.name}</h6>
                                  <p className="text-sm text-gray-600">{course.code} • {course.credits} credits</p>
                                  <p className="text-xs text-gray-500">{course._count.enrollments} students</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No courses in this semester</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Semesters</h3>
              <p className="text-gray-600">Create your first semester to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Course</h3>
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div>
                <label className="form-label">Course Name</label>
                <input
                  type="text"
                  value={courseFormData.name}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Course Code</label>
                <input
                  type="text"
                  value={courseFormData.code}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                  rows={3}
                />
              </div>
              <div>
                <label className="form-label">Credits</label>
                <input
                  type="number"
                  value={courseFormData.credits}
                  onChange={(e) => setCourseFormData(prev => ({ ...prev, credits: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary" disabled={createCourseMutation.isLoading}>
                  {createCourseMutation.isLoading ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseForm(false)
                    setCourseFormData({ name: '', code: '', description: '', credits: '' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SemesterManagement