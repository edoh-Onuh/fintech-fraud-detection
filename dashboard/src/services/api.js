import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear and redirect if not already on login (prevent loop)
      const token = localStorage.getItem('token')
      if (token) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Dispatch custom event instead of reload to avoid infinite loop
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

// API Methods
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  logout: () => 
    api.post('/auth/logout'),
}

export const fraudAPI = {
  detectFraud: (transaction) => 
    api.post('/detect/fraud', transaction),
}

export const metricsAPI = {
  getMetrics: () => 
    api.get('/metrics'),
  getHealth: () => 
    api.get('/health'),
}

export const modelsAPI = {
  listModels: () => 
    api.get('/models'),
}

export const auditAPI = {
  getEvents: (params) => 
    api.get('/audit/events', { params }),
}

export default api
