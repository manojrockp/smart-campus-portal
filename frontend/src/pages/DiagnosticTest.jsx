import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const DiagnosticTest = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results = {}

    try {
      // Test 1: Check user authentication
      results.userAuth = {
        status: 'success',
        data: {
          isLoggedIn: !!user,
          role: user?.role,
          isAdmin: user?.role === 'ADMIN'
        }
      }
    } catch (error) {
      results.userAuth = { status: 'error', error: error.message }
    }

    try {
      // Test 2: Test faculty-courses route
      const response = await axios.get('/api/faculty-courses/test')
      results.facultyCoursesRoute = { status: 'success', data: response.data }
    } catch (error) {
      results.facultyCoursesRoute = { 
        status: 'error', 
        error: error.message,
        details: error.response?.data 
      }
    }

    try {
      // Test 3: Test faculty endpoint
      const response = await axios.get('/api/users?role=FACULTY')
      results.facultyEndpoint = { 
        status: 'success', 
        data: { count: response.data?.length || 0 } 
      }
    } catch (error) {
      results.facultyEndpoint = { 
        status: 'error', 
        error: error.message,
        details: error.response?.data 
      }
    }

    try {
      // Test 4: Test courses endpoint
      const response = await axios.get('/api/courses')
      results.coursesEndpoint = { 
        status: 'success', 
        data: { count: response.data?.length || 0 } 
      }
    } catch (error) {
      results.coursesEndpoint = { 
        status: 'error', 
        error: error.message,
        details: error.response?.data 
      }
    }

    try {
      // Test 5: Test faculty-course assignments endpoint
      const response = await axios.get('/api/faculty-courses')
      results.assignmentsEndpoint = { 
        status: 'success', 
        data: { count: response.data?.length || 0 } 
      }
    } catch (error) {
      results.assignmentsEndpoint = { 
        status: 'error', 
        error: error.message,
        details: error.response?.data 
      }
    }

    setTestResults(results)
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const renderTestResult = (testName, result) => (
    <div key={testName} className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{testName}</h3>
        <span className={`px-2 py-1 rounded text-sm ${
          result.status === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {result.status}
        </span>
      </div>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty Assignments Diagnostic</h1>
        <p className="text-gray-600">Testing all components of the faculty assignment system</p>
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={runTests} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(testResults).map(([testName, result]) => 
          renderTestResult(testName, result)
        )}
      </div>

      {Object.keys(testResults).length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Click "Run Tests" to start diagnostic
        </div>
      )}
    </div>
  )
}

export default DiagnosticTest