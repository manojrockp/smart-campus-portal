import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../config/api'
import { Plus, X, BookOpen, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const FacultyAssignments = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  
  // Debug: Log component mount and user info
  console.log('FacultyAssignments component mounted')
  console.log('Current user:', user)
  console.log('User role:', user?.role)
  console.log('Is admin?', user?.role === 'ADMIN')
  
  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-sm mt-2">
            You need admin privileges to access this page.
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Current role: {user?.role || 'Unknown'}
          </p>
        </div>
      </div>
    )
  }

  // Get all faculty members
  const { data: faculty, error: facultyError } = useQuery('faculty', async () => {
    console.log('Fetching faculty...')
    const response = await api.get('/api/users?role=FACULTY')
    console.log('Faculty response:', response.data)
    return response.data
  }, {
    onError: (error) => {
      console.error('Faculty fetch error:', error)
      toast.error('Failed to load faculty members')
    }
  })

  // Get all courses
  const { data: courses, error: coursesError } = useQuery('courses', async () => {
    console.log('Fetching courses...')
    const response = await api.get('/api/courses')
    console.log('Courses response:', response.data)
    return response.data
  }, {
    onError: (error) => {
      console.error('Courses fetch error:', error)
      toast.error('Failed to load courses')
    }
  })

  // Get faculty-course assignments
  const { data: assignments, isLoading, error: assignmentsError } = useQuery('faculty-assignments', async () => {
    console.log('Fetching assignments...')
    const response = await api.get('/api/faculty-courses/assignments')
    console.log('Assignments response:', response.data)
    return response.data
  }, {
    onError: (error) => {
      console.error('Assignments fetch error:', error)
      toast.error('Failed to load assignments')
    }
  })

  // Assign course to faculty
  const assignMutation = useMutation(
    (data) => api.post('/api/faculty-courses/assign', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty-assignments')
        setShowAssignForm(false)
        setSelectedFaculty('')
        setSelectedCourse('')
        toast.success('Course assigned successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign course')
      }
    }
  )

  // Remove assignment
  const removeMutation = useMutation(
    ({ facultyId, courseId }) => api.delete('/api/faculty-courses/unassign', { data: { facultyId, courseId } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty-assignments')
        toast.success('Assignment removed successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove assignment')
      }
    }
  )

  const handleAssign = (e) => {
    e.preventDefault()
    if (!selectedFaculty || !selectedCourse) {
      toast.error('Please select both faculty and course')
      return
    }
    assignMutation.mutate({
      facultyId: selectedFaculty,
      courseId: selectedCourse
    })
  }

  const handleRemove = (assignment) => {
    if (window.confirm('Are you sure you want to remove this assignment?')) {
      removeMutation.mutate({ facultyId: assignment.facultyId, courseId: assignment.courseId })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Show error state if any critical data failed to load
  if (facultyError || coursesError || assignmentsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-medium">Error Loading Data</h3>
          <p className="text-sm mt-2">
            {facultyError && 'Failed to load faculty. '}
            {coursesError && 'Failed to load courses. '}
            {assignmentsError && 'Failed to load assignments. '}
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Check console for details. Make sure the backend server is running.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Course Assignments</h1>
          <p className="text-gray-600">Assign courses to faculty members</p>
        </div>
        <button
          onClick={() => setShowAssignForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Course
        </button>
      </div>

      {/* Assignment Form */}
      {showAssignForm && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Course to Faculty</h3>
              <button 
                onClick={() => setShowAssignForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="form-label">Select Faculty</label>
                <select
                  className="form-input"
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  required
                >
                  <option value="">Choose faculty member...</option>
                  {faculty?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Select Course</label>
                <select
                  className="form-input"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                >
                  <option value="">Choose course...</option>
                  {courses?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                  disabled={assignMutation.isLoading}
                >
                  {assignMutation.isLoading ? 'Assigning...' : 'Assign Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments?.map((assignment) => (
          <div key={assignment.id} className="card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment.course.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Course Code: {assignment.course.code} | Credits: {assignment.course.credits}
                    </p>
                    <div className="flex items-center mt-2">
                      <User className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-700">
                        {assignment.faculty.firstName} {assignment.faculty.lastName} ({assignment.faculty.employeeId})
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(assignment)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {assignments?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No course assignments</h3>
          <p className="text-gray-600">Start by assigning courses to faculty members.</p>
        </div>
      )}
    </div>
  )
}

export default FacultyAssignments