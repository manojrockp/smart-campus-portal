import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Calendar, Plus, X, CheckCircle, XCircle, Clock, User, BarChart3, Filter, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatDateTime } from '../utils/dateUtils'

const Leaves = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'SICK'
  })
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Get all leave applications
  const { data: leaves, isLoading } = useQuery('leaves', async () => {
    const response = await axios.get('/api/leaves')
    return response.data
  })

  // Create leave application mutation
  const createLeaveMutation = useMutation(
    (leaveData) => axios.post('/api/leaves', leaveData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leaves')
        setShowAddForm(false)
        resetForm()
        toast.success('Leave application submitted successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit leave application')
      }
    }
  )

  // Faculty approve mutation
  const facultyApproveMutation = useMutation(
    ({ id, action }) => axios.put(`/api/leaves/${id}/faculty-approve`, { action }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leaves')
        toast.success('Leave application processed successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to process leave application')
      }
    }
  )

  // Admin approve mutation
  const adminApproveMutation = useMutation(
    ({ id, action }) => axios.put(`/api/leaves/${id}/admin-approve`, { action }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leaves')
        toast.success('Leave application processed successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to process leave application')
      }
    }
  )

  const resetForm = () => {
    setFormData({ startDate: '', endDate: '', reason: '', leaveType: 'SICK' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createLeaveMutation.mutate(formData)
  }

  const handleFacultyAction = (id, action) => {
    if (window.confirm(`Are you sure you want to ${action.toLowerCase()} this leave application?`)) {
      facultyApproveMutation.mutate({ id, action })
    }
  }

  const handleAdminAction = (id, action) => {
    if (window.confirm(`Are you sure you want to ${action.toLowerCase()} this leave application?`)) {
      adminApproveMutation.mutate({ id, action })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'FACULTY_APPROVED':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FACULTY_APPROVED':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate statistics
  const stats = {
    total: leaves?.length || 0,
    pending: leaves?.filter(l => l.status === 'PENDING').length || 0,
    approved: leaves?.filter(l => l.status === 'APPROVED').length || 0,
    rejected: leaves?.filter(l => l.status === 'REJECTED').length || 0,
    facultyApproved: leaves?.filter(l => l.status === 'FACULTY_APPROVED').length || 0
  }

  // Filter leaves based on status and type
  const filteredLeaves = leaves?.filter(leave => {
    const matchesStatus = !statusFilter || leave.status === statusFilter
    const matchesType = !typeFilter || leave.leaveType === typeFilter
    return matchesStatus && matchesType
  }) || []

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
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">
            {user.role === 'STUDENT' ? 'Apply for leave and track your applications' : 
             user.role === 'FACULTY' ? 'Review and approve student leave applications' :
             'Manage all leave applications'}
          </p>
        </div>
        {user.role === 'STUDENT' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Apply for Leave
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Faculty Approved</p>
              <p className="text-xl font-semibold text-gray-900">{stats.facultyApproved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-xl font-semibold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-xl font-semibold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="FACULTY_APPROVED">Faculty Approved</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="">All Types</option>
            <option value="SICK">Sick Leave</option>
            <option value="PERSONAL">Personal Leave</option>
            <option value="EMERGENCY">Emergency Leave</option>
            <option value="MEDICAL">Medical Leave</option>
            <option value="OTHER">Other</option>
          </select>
          
          {(statusFilter || typeFilter) && (
            <button
              onClick={() => {
                setStatusFilter('')
                setTypeFilter('')
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          )}
          
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredLeaves.length} of {stats.total} applications
          </div>
        </div>
      </div>

      {/* Add Leave Form */}
      {showAddForm && user.role === 'STUDENT' && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Apply for Leave</h3>
              <button 
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Leave Type</label>
                <select
                  className="form-input"
                  value={formData.leaveType}
                  onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                >
                  <option value="SICK">Sick Leave</option>
                  <option value="PERSONAL">Personal Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Please provide detailed reason for leave"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                  disabled={createLeaveMutation.isLoading}
                >
                  {createLeaveMutation.isLoading ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Applications List */}
      <div className="space-y-4">
        {filteredLeaves?.map((leave) => (
          <div key={leave.id} className="card">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {leave.student.firstName} {leave.student.lastName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(leave.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(leave.status)}`}>
                          {leave.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Student ID: {leave.student.studentId} | Type: {leave.leaveType}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Duration: {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </p>
                    <p className="text-gray-700 mb-4">{leave.reason}</p>
                    
                    {/* Approval Information */}
                    <div className="space-y-2 text-sm">
                      {leave.approvedByFaculty && (
                        <p className="text-blue-600">
                          ✓ Faculty Approved by: {leave.approvedByFaculty.firstName} {leave.approvedByFaculty.lastName} ({leave.approvedByFaculty.employeeId})
                        </p>
                      )}
                      {leave.approvedByAdmin && (
                        <p className="text-green-600">
                          ✓ Admin Approved by: {leave.approvedByAdmin.firstName} {leave.approvedByAdmin.lastName}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      Applied on: {formatDateTime(leave.createdAt)}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  {user.role === 'FACULTY' && leave.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFacultyAction(leave.id, 'APPROVE')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleFacultyAction(leave.id, 'REJECT')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {user.role === 'ADMIN' && leave.status === 'FACULTY_APPROVED' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAdminAction(leave.id, 'APPROVE')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Final Approve
                      </button>
                      <button
                        onClick={() => handleAdminAction(leave.id, 'REJECT')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLeaves?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter || typeFilter ? 'No matching leave applications' : 'No leave applications'}
          </h3>
          <p className="text-gray-600">
            {statusFilter || typeFilter 
              ? 'Try adjusting your filters to see more results.'
              : user.role === 'STUDENT' 
                ? 'You haven\'t applied for any leave yet.' 
                : 'No leave applications to review.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default Leaves