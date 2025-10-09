import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Users, Plus, Mail, User, Edit, Trash2, X, Upload, Search, Filter, Download, UserPlus, GraduationCap, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

const Students = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    password: '',
    section: '',
    year: 1
  })
  const [sectionFilter, setSectionFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadYear, setUploadYear] = useState('')
  const [uploadSection, setUploadSection] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'
  const [showFilters, setShowFilters] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [enrollYear, setEnrollYear] = useState('')
  const [enrollSection, setEnrollSection] = useState('')
  const [enrollSemester, setEnrollSemester] = useState('')

  const { data: students, isLoading, error } = useQuery(
    ['students', sectionFilter, yearFilter], 
    async () => {
      const params = new URLSearchParams({ role: 'STUDENT' })
      if (sectionFilter) params.append('section', sectionFilter)
      if (yearFilter) params.append('year', yearFilter)
      const response = await axios.get(`/api/users?${params}`)
      return response.data
    }, {
      onError: (error) => {
        console.error('Error fetching students:', error)
        toast.error('Failed to load students')
      }
    }
  )

  const { data: courses } = useQuery('courses', async () => {
    const response = await axios.get('/api/courses')
    return response.data
  })

  const { data: semesters } = useQuery('semesters', async () => {
    const response = await axios.get('/api/semesters')
    return response.data
  })

  const enrollStudentMutation = useMutation(
    ({ year, section, courseIds, semesterId }) => {
      return axios.post('/api/enrollments/section', {
        year,
        section,
        courseIds,
        semesterId
      })
    },
    {
      onSuccess: (response) => {
        const { enrolledCount } = response.data
        toast.success(`Successfully enrolled ${enrolledCount} students in selected courses!`)
        setShowEnrollModal(false)
        setSelectedCourses([])
        setEnrollYear('')
        setEnrollSection('')
        setEnrollSemester('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to enroll section')
      }
    }
  )

  const addStudentMutation = useMutation(
    (studentData) => {
      console.log('Sending student data:', studentData)
      return axios.post('/api/auth/register', {
        ...studentData,
        role: 'STUDENT'
      })
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('students')
        setShowAddForm(false)
        resetForm()
        
        // Show credentials in success message
        const { credentials } = response.data
        toast.success(
          `Student added successfully!\n\nLogin Credentials:\nUsername: ${credentials.username}\nPassword: ${credentials.password}\nEmail: ${credentials.email}`,
          { duration: 8000 }
        )
      },
      onError: (error) => {
        console.error('Add student error:', error)
        console.error('Error response:', error.response?.data)
        toast.error(error.response?.data?.message || 'Failed to add student')
      }
    }
  )

  const updateStudentMutation = useMutation(
    ({ id, ...data }) => axios.put(`/api/users/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students')
        setEditingStudent(null)
        resetForm()
        toast.success('Student updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update student')
      }
    }
  )

  const deleteStudentMutation = useMutation(
    (id) => axios.delete(`/api/users/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students')
        toast.success('Student deleted successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete student')
      }
    }
  )

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', studentId: '', password: '', section: '', year: 1 })
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      studentId: student.studentId,
      password: '',
      section: student.section || '',
      year: student.year || 1
    })
    setShowAddForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteStudentMutation.mutate(id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, ...formData })
    } else {
      addStudentMutation.mutate(formData)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingStudent(null)
    resetForm()
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    toast.loading('Reading Excel file...', { id: 'upload' })

    try {
      // Read Excel file
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      toast.loading(`Processing ${jsonData.length} students...`, { id: 'upload' })

      // Validate and format data
      const users = jsonData.map(row => {
        const keys = Object.keys(row)
        return {
          firstName: row.firstName || row['First Name'] || row[keys[0]] || '',
          lastName: row.lastName || row['Last Name'] || row[keys[1]] || '',
          email: row.email || row.Email || row[keys[2]] || '',
          studentId: row.studentId || row['Student ID'] || row[keys[3]] || '',
          password: row.password || row.Password || row[keys[4]] || row[keys[3]] || '',
          section: uploadSection,
          year: uploadYear
        }
      })

      toast.loading('Uploading students to database...', { id: 'upload' })

      // Send to backend
      const response = await axios.post('/api/auth/bulk-create', { users })
      
      queryClient.invalidateQueries('students')
      
      const { results } = response.data
      
      toast.success(
        `✅ Upload completed!\n${results.successful.length} students added successfully\n${results.failed.length} failed`,
        { id: 'upload', duration: 5000 }
      )

      if (results.failed.length > 0) {
        const errorDetails = results.failed.slice(0, 3).map(f => 
          `${f.data.firstName} ${f.data.lastName}: ${f.error}`
        ).join('\n')
        toast.error(`❌ Upload errors:\n${errorDetails}`, { duration: 10000 })
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(
        `❌ Upload failed: ${error.response?.data?.message || 'Failed to upload Excel file'}`,
        { id: 'upload', duration: 8000 }
      )
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleBulkDelete = async () => {
    const confirmMessage = `Are you sure you want to delete ALL ${students?.length || 0} students?\n\nThis action cannot be undone!`
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await axios.delete('/api/users/bulk-delete-students')
        
        queryClient.invalidateQueries('students')
        
        toast.success(
          `Successfully deleted ${response.data.count} students`,
          { duration: 5000 }
        )
      } catch (error) {
        console.error('Bulk delete error:', error)
        toast.error(error.response?.data?.message || 'Failed to delete students')
      }
    }
  }

  const handleEnrollSubmit = () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course')
      return
    }
    if (!enrollYear || !enrollSection || !enrollSemester) {
      toast.error('Please select year, section, and semester first')
      return
    }
    
    // Get all students in the selected year and section
    const sectionStudents = students?.filter(student => 
      student.year?.toString() === enrollYear && student.section === enrollSection
    )
    
    if (!sectionStudents || sectionStudents.length === 0) {
      toast.error('No students found in selected year and section')
      return
    }
    
    enrollStudentMutation.mutate({
      year: parseInt(enrollYear),
      section: enrollSection,
      courseIds: selectedCourses,
      semesterId: enrollSemester
    })
  }

  // Filter students based on search term, year, and section
  const filteredStudents = students?.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower)
    )
    const matchesYear = !yearFilter || student.year?.toString() === yearFilter
    const matchesSection = !sectionFilter || student.section === sectionFilter
    
    return matchesSearch && matchesYear && matchesSection
  }) || []

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
        <div className="text-red-600 mb-4">Error loading students</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <GraduationCap className="h-8 w-8 mr-3 text-primary-600" />
                Student Management
              </h1>
              <p className="text-gray-600 mt-1">Manage student accounts, enrollment, and academic information</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
              
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                  className="inline-flex items-center px-3 py-2 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {viewMode === 'cards' ? 'Table View' : 'Card View'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Hash className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sections</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(students?.map(s => s.section).filter(Boolean)).size}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Years</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(students?.map(s => s.year).filter(Boolean)).size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {(yearFilter || sectionFilter || searchTerm) && (
                  <button
                    onClick={() => {
                      setYearFilter('')
                      setSectionFilter('')
                      setSearchTerm('')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* Action Buttons */}
              {user.role === 'ADMIN' && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAddForm(true)}
                    disabled={uploadYear === '' || uploadSection === ''}
                    className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${
                      uploadYear === '' || uploadSection === ''
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </button>
                  
                  <label className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${
                    isUploading || uploadYear === '' || uploadSection === ''
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                  }`}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Bulk Upload'}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading || uploadYear === '' || uploadSection === ''}
                    />
                  </label>
                  
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Section
                  </button>
                  
                  <button
                    onClick={handleBulkDelete}
                    disabled={uploadYear === '' || uploadSection === ''}
                    className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${
                      uploadYear === '' || uploadSection === ''
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </button>
                </div>
              )}
            </div>
            
            {/* Upload Target Selection */}
            {user.role === 'ADMIN' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-amber-800">Target for new students:</span>
                  </div>
                  <select
                    value={uploadYear}
                    onChange={(e) => setUploadYear(parseInt(e.target.value))}
                    className="text-sm border border-amber-300 rounded-lg px-3 py-1 bg-white focus:ring-2 focus:ring-amber-500"
                    disabled={isUploading}
                  >
                    <option value="">Select Year</option>
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                  <select
                    value={uploadSection}
                    onChange={(e) => setUploadSection(e.target.value)}
                    className="text-sm border border-amber-300 rounded-lg px-3 py-1 bg-white focus:ring-2 focus:ring-amber-500"
                    disabled={isUploading}
                  >
                    <option value="">Select Section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                  {(uploadYear === '' || uploadSection === '') && (
                    <span className="text-xs text-amber-700">⚠️ Select year and section to enable student operations</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Student Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingStudent ? 'Edit Student Information' : 'Add New Student'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingStudent ? 'Update student details below' : 'Fill in the student information to create a new account'}
                  </p>
                </div>
                <button 
                  onClick={handleCancel} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="student@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      required
                      placeholder="e.g., STU2024001"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used as the login username</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      placeholder="Enter initial password"
                    />
                    <p className="text-xs text-gray-500 mt-1">Student can change this after first login</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                    >
                      <option value="">Select Year</option>
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      required
                    >
                      <option value="">Select Section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                  >
                    {editingStudent ? 'Update Student' : 'Create Student'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

        {/* Enrollment Modal */}
        {showEnrollModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Enroll Section in Courses
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select year, section, and courses to enroll students
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowEnrollModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <select
                        value={enrollYear}
                        onChange={(e) => setEnrollYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                      <select
                        value={enrollSection}
                        onChange={(e) => setEnrollSection(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <select
                        value={enrollSemester}
                        onChange={(e) => setEnrollSemester(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">Select Semester</option>
                        {semesters?.map((semester) => (
                          <option key={semester.id} value={semester.id}>
                            {semester.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Select courses to enroll all students in this section for the selected semester:</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {courses?.map((course) => (
                      <label key={course.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourses([...selectedCourses, course.id])
                            } else {
                              setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-sm">{course.name}</div>
                          <div className="text-xs text-gray-500">{course.code} • {course.credits} credits</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEnrollModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollSubmit}
                    disabled={selectedCourses.length === 0 || enrollStudentMutation.isLoading || !enrollYear || !enrollSection || !enrollSemester}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {enrollStudentMutation.isLoading ? 'Enrolling...' : 'Enroll Section'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Student Directory</h2>
              <div className="text-sm text-gray-500">
                Showing {filteredStudents.length} of {students?.length || 0} students
              </div>
            </div>
            
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents?.map((student) => (
                  <div key={student.id} className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {student.studentId}
                          </p>
                        </div>
                      </div>
                      {user.role === 'ADMIN' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {student.year && `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year`}
                        </span>
                        {student.section && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Section {student.section}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        Joined: {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      {user.role === 'ADMIN' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents?.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <User className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.year && `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.section && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Section {student.section}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                        {user.role === 'ADMIN' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {filteredStudents?.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-center py-16">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No students match your search' : 'No students found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `Try adjusting your search term "${searchTerm}" or clear filters` 
                  : 'Add your first student to get started with student management'
                }
              </p>
              {!searchTerm && user.role === 'ADMIN' && (
                <button
                  onClick={() => setShowAddForm(true)}
                  disabled={uploadYear === '' || uploadSection === ''}
                  className={`inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-colors shadow-sm ${
                    uploadYear === '' || uploadSection === ''
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Student
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Students