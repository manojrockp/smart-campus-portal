import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Users, Plus, Mail, User, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const Faculty = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    password: ''
  })

  const { data: faculty, isLoading, error } = useQuery('faculty', async () => {
    const response = await axios.get('/api/users?role=FACULTY')
    return response.data
  })

  const addFacultyMutation = useMutation(
    (facultyData) => {
      console.log('Sending faculty data:', facultyData)
      return axios.post('/api/auth/register', {
        ...facultyData,
        role: 'FACULTY'
      })
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('faculty')
        setShowAddForm(false)
        resetForm()
        
        // Show credentials in success message
        const { credentials } = response.data
        toast.success(
          `Faculty added successfully!\n\nLogin Credentials:\nUsername: ${credentials.username}\nPassword: ${credentials.password}\nEmail: ${credentials.email}`,
          { duration: 8000 }
        )
      },
      onError: (error) => {
        console.error('Add faculty error:', error)
        console.error('Error response:', error.response?.data)
        toast.error(error.response?.data?.message || 'Failed to add faculty')
      }
    }
  )

  const updateFacultyMutation = useMutation(
    ({ id, ...data }) => axios.put(`/api/users/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty')
        setEditingFaculty(null)
        resetForm()
        toast.success('Faculty updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update faculty')
      }
    }
  )

  const deleteFacultyMutation = useMutation(
    (id) => axios.delete(`/api/users/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faculty')
        toast.success('Faculty deleted successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete faculty')
      }
    }
  )

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', employeeId: '', password: '' })
  }

  const handleEdit = (facultyMember) => {
    setEditingFaculty(facultyMember)
    setFormData({
      firstName: facultyMember.firstName,
      lastName: facultyMember.lastName,
      email: facultyMember.email,
      employeeId: facultyMember.employeeId,
      password: ''
    })
    setShowAddForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      deleteFacultyMutation.mutate(id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingFaculty) {
      updateFacultyMutation.mutate({ id: editingFaculty.id, ...formData })
    } else {
      addFacultyMutation.mutate(formData)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingFaculty(null)
    resetForm()
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Access Denied</div>
        <p className="text-gray-600">Only administrators can manage faculty accounts.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading faculty</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <p className="text-gray-600">Manage faculty accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Faculty
        </button>
      </div>

      {/* Add/Edit Faculty Form */}
      {showAddForm && (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
              </h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  required
                  placeholder="This will be the faculty's username"
                />
                <p className="text-xs text-gray-500 mt-1">Faculty will use this ID as username to login</p>
              </div>
              <div>
                <label className="form-label">Password (Admin Generated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Enter password for faculty"
                />
                <p className="text-xs text-gray-500 mt-1">Faculty will use this password to login</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty?.map((facultyMember) => (
          <div key={facultyMember.id} className="card">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">
                    {facultyMember.firstName} {facultyMember.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {facultyMember.employeeId}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {facultyMember.email}
                </div>
                <div className="text-xs text-gray-500">
                  Login: {facultyMember.employeeId} / Password: Set by admin
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Joined: {new Date(facultyMember.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(facultyMember)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Faculty"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(facultyMember.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Faculty"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {faculty?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No faculty found</h3>
          <p className="text-gray-600">Add your first faculty member to get started.</p>
        </div>
      )}
    </div>
  )
}

export default Faculty