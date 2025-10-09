import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { BookOpen, Users, Plus, Calendar, Edit, Trash2, X, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const Courses = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: '',
    semesterId: ''
  })

  const { data: coursesResponse, isLoading } = useQuery(
    ['courses', selectedSemester], 
    async () => {
      const params = selectedSemester ? `?semesterId=${selectedSemester}` : ''
      const response = await axios.get(`/api/courses${params}`)
      return response.data
    }
  )

  const { data: semesters } = useQuery('semesters', async () => {
    const response = await axios.get('/api/semesters')
    return response.data
  })

  // Handle both array response and object response with message
  const courses = Array.isArray(coursesResponse) ? coursesResponse : (coursesResponse?.courses || [])
  const noCoursesMessage = coursesResponse?.message

  const createCourseMutation = useMutation(
    (courseData) => axios.post('/api/courses', courseData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses')
        resetForm()
        toast.success('Course created successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create course')
      }
    }
  )

  const updateCourseMutation = useMutation(
    ({ id, ...data }) => axios.put(`/api/courses/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses')
        resetForm()
        toast.success('Course updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update course')
      }
    }
  )

  const deleteCourseMutation = useMutation(
    (id) => axios.delete(`/api/courses/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses')
        toast.success('Course deleted successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete course')
      }
    }
  )

  const enrollMutation = useMutation(
    (courseId) => axios.post(`/api/courses/${courseId}/enroll`, {
      semester: 'Fall',
      year: new Date().getFullYear()
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses')
        toast.success('Enrolled successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to enroll')
      }
    }
  )

  const resetForm = () => {
    setShowCreateForm(false)
    setEditingCourse(null)
    setFormData({ name: '', code: '', description: '', credits: '', semesterId: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, ...formData })
    } else {
      createCourseMutation.mutate(formData)
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description,
      credits: course.credits.toString(),
      semesterId: course.semesterId || ''
    })
    setShowCreateForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourseMutation.mutate(id)
    }
  }

  const handleEnroll = (courseId) => {
    enrollMutation.mutate(courseId)
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
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Manage and view course information</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Semester Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-input py-2 px-3 text-sm min-w-[150px]"
            >
              <option value="">All Semesters</option>
              {semesters?.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Course Form */}
      {showCreateForm && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Course Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Course Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Credits</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Semester</label>
                  <select
                    className="form-input"
                    value={formData.semesterId}
                    onChange={(e) => setFormData({...formData, semesterId: e.target.value})}
                  >
                    <option value="">Select Semester (Optional)</option>
                    {semesters?.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
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

      {/* Courses Display */}
      {selectedSemester ? (
        /* Single Semester View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <div key={course.id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.code}</p>
                    </div>
                  </div>
                  <span className="badge badge-primary">{course.credits} Credits</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {course._count.enrollments} Students
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {user.role === 'ADMIN' && (
                      <>
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {user.role === 'STUDENT' && (
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                        Enrolled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grouped by Semester View */
        <div className="space-y-8">
          {semesters?.map((semester) => {
            const semesterCourses = courses?.filter(course => course.semesterId === semester.id) || []
            const unassignedCourses = courses?.filter(course => !course.semesterId) || []
            
            if (semesterCourses.length === 0 && semester.id !== 'unassigned') return null
            
            return (
              <div key={semester.id} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">{semester.name}</h2>
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm font-medium">
                    {semesterCourses.length} courses
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {semesterCourses.map((course) => (
                    <div key={course.id} className="card hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <BookOpen className="h-6 w-6 text-primary-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="font-semibold text-gray-900">{course.name}</h3>
                              <p className="text-sm text-gray-500">{course.code}</p>
                            </div>
                          </div>
                          <span className="badge badge-primary">{course.credits} Credits</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {course._count.enrollments} Students
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {user.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleEdit(course)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Course"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(course.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Course"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {user.role === 'STUDENT' && (
                              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                                Enrolled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          {/* Unassigned Courses */}
          {courses?.filter(course => !course.semesterId).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900">Unassigned Courses</h2>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                  {courses?.filter(course => !course.semesterId).length} courses
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses?.filter(course => !course.semesterId).map((course) => (
                  <div key={course.id} className="card hover:shadow-lg transition-shadow border-l-4 border-l-gray-400">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <BookOpen className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <h3 className="font-semibold text-gray-900">{course.name}</h3>
                            <p className="text-sm text-gray-500">{course.code}</p>
                          </div>
                        </div>
                        <span className="badge badge-secondary">{course.credits} Credits</span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          {course._count.enrollments} Students
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {user.role === 'ADMIN' && (
                            <>
                              <button
                                onClick={() => handleEdit(course)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Course"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(course.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Course"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {courses?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
          <p className="text-gray-600">
            {noCoursesMessage || 'No courses have been created yet.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default Courses