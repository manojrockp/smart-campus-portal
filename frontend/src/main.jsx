import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

// Configure axios base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-campus-backend-w37b.onrender.com'
axios.defaults.baseURL = API_BASE_URL

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)