import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../config/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Users, BookOpen } from 'lucide-react'

const FacultyCourseAssignment = () => {
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const queryClient = useQueryClient()

  const { data: faculty } = useQuery('faculty', async () => {
    const response = await api.get('/users')
    return response.data.filter(user => user.role === 'FACULTY')
  })

  const { data: allCourses } = useQuery('all-courses', async () => {
    const response = await api.get('/courses')
    return Array.isArray(response.data) ? response.data : response.data.courses || []
  })

  const { data: assignments } = useQuery('faculty-assignments', async () => {
    const response = await api.get('/faculty-courses/assignments')
    return response.data
  })

  const { data: unassignedCourses } = useQuery('unassigned-courses', async () => {
    const response = await api.get('/faculty-courses/unassigned')
    return response.data
  })

  const assignMutation = useMutation(
    async ({ facultyId, courseId }) => {
      await api.post('/faculty-courses/assign', { facultyId, courseId })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty-assignments')
        toast.success('Course assigned successfully')
        setSelectedFaculty('')
        setSelectedCourse('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Assignment failed')
      }
    }
  )

  const unassignMutation = useMutation(
    async ({ facultyId, courseId }) => {
      await api.delete('/faculty-courses/unassign', {
        data: { facultyId, courseId }
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty-assignments')
        toast.success('Assignment removed successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Removal failed')
      }
    }
  )

  const handleAssign = () => {
    if (!selectedFaculty || !selectedCourse) {
      toast.error('Please select both faculty and course')
      return
    }
    assignMutation.mutate({ facultyId: selectedFaculty, courseId: selectedCourse })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Courses to Faculty</h1>
        <p className="text-gray-600">Assign courses to faculty members. Only assigned faculty can mark attendance for their courses.</p>
      </div>

      {/* Assignment Form */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-primary-600" />
          Assign Course to Faculty
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Faculty Member</label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="form-input"
            >
              <option value="">Select Faculty</option>
              {faculty?.map(f => (
                <option key={f.id} value={f.id}>
                  {f.firstName} {f.lastName} ({f.employeeId})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-input"
            >
              <option value="">Select Course</option>
              {allCourses?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleAssign}
              disabled={assignMutation.isLoading}
              className="btn-primary w-full"
            >
              {assignMutation.isLoading ? 'Assigning...' : 'Assign Course'}
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Courses Warning */}
      {unassignedCourses && unassignedCourses.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="h-5 w-5 bg-yellow-400 rounded-full mr-2"></div>
            <h3 className="font-medium text-yellow-800">Unassigned Courses</h3>
          </div>
          <p className="text-yellow-700 text-sm mb-3">
            The following courses have no faculty assigned. No one can mark attendance for these courses:
          </p>
          <div className="space-y-1">
            {unassignedCourses.map(course => (
              <div key={course.id} className="text-sm text-yellow-800 font-medium">
                • {course.name} ({course.code})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Assignments */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            Current Assignments
          </h2>
        </div>
        
        <div className="p-6">
          {assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={`${assignment.facultyId}-${assignment.courseId}`} 
                     className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {assignment.faculty.firstName} {assignment.faculty.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {assignment.course.name} ({assignment.course.code})
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => unassignMutation.mutate({
                      facultyId: assignment.facultyId,
                      courseId: assignment.courseId
                    })}
                    disabled={unassignMutation.isLoading}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No assignments found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FacultyCourseAssignment