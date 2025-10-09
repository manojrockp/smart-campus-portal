import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import axios from 'axios'
import { FileText, Upload, Calendar, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Assignments = () => {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [submissionText, setSubmissionText] = useState('')

  const { data: assignments, refetch } = useQuery('assignments', async () => {
    const response = await axios.get('/api/assignments')
    return response.data
  })

  const handleFileSubmission = async (assignmentId) => {
    try {
      const formData = new FormData()
      if (selectedFile) formData.append('file', selectedFile)
      if (submissionText) formData.append('content', submissionText)

      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Assignment submitted successfully!')
      setSelectedFile(null)
      setSubmissionText('')
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed')
    }
  }

  const getStatusColor = (assignment) => {
    if (user.role === 'STUDENT' && assignment.submissions?.length > 0) {
      const submission = assignment.submissions[0]
      if (submission.status === 'GRADED') return 'bg-green-100 text-green-800'
      if (submission.status === 'LATE') return 'bg-yellow-100 text-yellow-800'
      return 'bg-blue-100 text-blue-800'
    }
    
    const dueDate = new Date(assignment.dueDate)
    const now = new Date()
    
    if (now > dueDate) return 'bg-red-100 text-red-800'
    if (dueDate - now < 24 * 60 * 60 * 1000) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (assignment) => {
    if (user.role === 'STUDENT' && assignment.submissions?.length > 0) {
      const submission = assignment.submissions[0]
      return submission.status
    }
    
    const dueDate = new Date(assignment.dueDate)
    const now = new Date()
    
    if (now > dueDate) return 'OVERDUE'
    if (dueDate - now < 24 * 60 * 60 * 1000) return 'DUE SOON'
    return 'ACTIVE'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600">
          {user.role === 'STUDENT' ? 'View and submit your assignments' : 'Manage course assignments'}
        </p>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {assignment.course.name} ({assignment.course.code})
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment)}`}>
                    {getStatusText(assignment)}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4">{assignment.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Max Marks: {assignment.maxMarks}
                  </div>
                </div>

                {user.role === 'STUDENT' && (
                  <div className="border-t pt-4">
                    {assignment.submissions?.length > 0 ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-green-800">
                              Assignment Submitted
                            </h4>
                            <p className="text-sm text-green-700">
                              Submitted on: {new Date(assignment.submissions[0].submittedAt).toLocaleDateString()}
                              {assignment.submissions[0].marks && (
                                <span className="ml-2">
                                  | Score: {assignment.submissions[0].marks}/{assignment.maxMarks}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Submission
                          </label>
                          <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your assignment text here..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            File Upload
                          </label>
                          <div className="flex items-center space-x-4">
                            <input
                              type="file"
                              onChange={(e) => setSelectedFile(e.target.files[0])}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleFileSubmission(assignment.id)}
                          disabled={!selectedFile && !submissionText}
                          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Assignment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {user.role === 'STUDENT' 
              ? 'No assignments have been posted yet.' 
              : 'Create your first assignment to get started.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default Assignments