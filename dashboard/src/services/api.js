import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jed24-api.onrender.com'

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

export const analyticsAPI = {
  getPatterns: (days = 7) =>
    api.get('/analytics/patterns', { params: { days, token: 'bearer' } }),
  getRiskTrends: (days = 30) =>
    api.get('/analytics/risk-trends', { params: { days, token: 'bearer' } }),
  getGeographicInsights: () =>
    api.get('/analytics/geographic-insights', { params: { token: 'bearer' } }),
  getRecommendations: (priority_filter) =>
    api.post('/analytics/recommendations', null, { params: { token: 'bearer', ...(priority_filter ? { priority_filter } : {}) } }),
  getBusinessImpact: (days = 30) =>
    api.get('/analytics/business-impact', { params: { days, token: 'bearer' } }),
  getModelComparison: () =>
    api.get('/analytics/model-comparison', { params: { token: 'bearer' } }),
}

export const exchangeRatesAPI = {
  getLatestRates: (base = 'GBP') =>
    api.get('/exchange-rates/latest', { params: { base } }),
  getCurrencies: () =>
    api.get('/exchange-rates/currencies'),
  convert: (amount, from_currency, to_currency) =>
    api.post('/exchange-rates/convert', { amount, from_currency, to_currency }),
  getHistorical: (base = 'GBP', start_date = '', end_date = '', symbols = 'USD,EUR,NGN') =>
    api.get('/exchange-rates/historical', { params: { base, start_date, end_date, symbols } }),
}

export default api
