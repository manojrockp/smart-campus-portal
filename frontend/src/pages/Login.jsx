import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const { login, register } = useAuth()
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        await login(data.email, data.password)
        toast.success('Login successful!')
      } else if (isPasswordReset) {
        const response = await axios.post('/api/password-reset/request', data)
        toast.success(response.data.message)
        setIsPasswordReset(false)
        setIsLogin(true)
      } else {
        await register(data)
        toast.success('Registration successful!')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">SC</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : isPasswordReset ? 'Reset Password' : 'Join Smart Campus'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to your account' : 
               isPasswordReset ? 'Request password reset from admin' : 'Admin-only registration'}
            </p>
          </div>
        
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            {isPasswordReset && (
              <>
                <div>
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    {...formRegister('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="form-input"
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">
                    Student ID (if student)
                  </label>
                  <input
                    {...formRegister('studentId')}
                    type="text"
                    className="form-input"
                    placeholder="Enter your student ID (optional)"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Employee ID (if faculty)
                  </label>
                  <input
                    {...formRegister('employeeId')}
                    type="text"
                    className="form-input"
                    placeholder="Enter your employee ID (optional)"
                  />
                </div>
              </>
            )}
            {!isLogin && !isPasswordReset && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      First Name
                    </label>
                    <input
                      {...formRegister('firstName', { required: 'First name is required' })}
                      type="text"
                      className="form-input"
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-danger-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">
                      Last Name
                    </label>
                    <input
                      {...formRegister('lastName', { required: 'Last name is required' })}
                      type="text"
                      className="form-input"
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-danger-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="form-label">
                    Role
                  </label>
                  <select
                    {...formRegister('role', { required: 'Role is required' })}
                    className="form-input"
                  >
                    <option value="">Select your role</option>
                    <option value="ADMIN">👨💼 Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-danger-600">{errors.role.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Only administrators can create accounts. Students and Faculty accounts are created by Admin.
                  </p>
                </div>
              </>
            )}
            
            {(isLogin || (!isLogin && !isPasswordReset)) && (
              <>
                <div>
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    {...formRegister('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="form-input"
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">
                    Password
                  </label>
                  <input
                    {...formRegister('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLogin ? '🚀 Sign In' : isPasswordReset ? '📧 Request Reset' : '✨ Create Account'}
            </button>
          </div>

          {isLogin && (
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordReset(true)
                  setIsLogin(false)
                }}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>
          )}
          
          {isPasswordReset && (
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordReset(false)
                  setIsLogin(true)
                }}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Back to Sign In
              </button>
            </div>
          )}
          
          {!isLogin && !isPasswordReset && (
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  )
}

export default Login