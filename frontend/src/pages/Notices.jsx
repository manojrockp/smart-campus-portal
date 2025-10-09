import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Bell, Plus, X, AlertCircle, Info, CheckCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const Notices = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL'
  })

  // Get all notices
  const { data: notices, isLoading } = useQuery('notices', async () => {
    const response = await axios.get('/api/notices')
    return response.data
  })

  // Create notice mutation
  const createNoticeMutation = useMutation(
    (noticeData) => axios.post('/api/notices', noticeData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notices')
        setShowAddForm(false)
        resetForm()
        toast.success('Notice created successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create notice')
      }
    }
  )

  // Delete notice mutation
  const deleteNoticeMutation = useMutation(
    (id) => axios.delete(`/api/notices/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notices')
        toast.success('Notice deleted successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete notice')
      }
    }
  )

  const resetForm = () => {
    setFormData({ title: '', content: '', priority: 'NORMAL' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    createNoticeMutation.mutate(formData)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      deleteNoticeMutation.mutate(id)
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'NORMAL':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'LOW':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-50'
      case 'NORMAL':
        return 'border-l-blue-500 bg-blue-50'
      case 'LOW':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
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
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600">
            {user.role === 'ADMIN' ? 'Manage campus-wide announcements' : 'Stay updated with latest announcements'}
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Notice
          </button>
        )}
      </div>

      {/* Add Notice Form */}
      {showAddForm && user.role === 'ADMIN' && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Notice</h3>
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
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter notice title"
                  required
                />
              </div>
              <div>
                <label className="form-label">Content *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter notice content"
                  required
                />
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="LOW">Low Priority</option>
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                  disabled={createNoticeMutation.isLoading}
                >
                  {createNoticeMutation.isLoading ? 'Creating...' : 'Create Notice'}
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

      {/* Notices List */}
      <div className="space-y-4">
        {notices?.map((notice) => (
          <div key={notice.id} className={`card border-l-4 ${getPriorityColor(notice.priority)}`}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getPriorityIcon(notice.priority)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {notice.title}
                    </h3>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                      {notice.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>
                          By: {notice.author?.firstName} {notice.author?.lastName} ({notice.author?.role})
                        </span>
                        <span>
                          {new Date(notice.createdAt).toLocaleDateString()} at {new Date(notice.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notice.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          notice.priority === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {notice.priority}
                        </span>
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(notice.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Notice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notices?.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notices yet</h3>
          <p className="text-gray-600">
            {user.role === 'ADMIN' ? 'Create your first notice to get started.' : 'Check back later for updates.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default Notices