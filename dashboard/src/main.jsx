import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import './animations.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
})

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('JED 24 Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#e9f1f1', fontFamily: 'sans-serif', padding: '20px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
            <h1 style={{ color: '#13635d', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>JED 24</h1>
            <p style={{ color: '#51a97d', fontWeight: '600', marginBottom: '16px' }}>Something went wrong loading the dashboard.</p>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => { localStorage.clear(); window.location.reload() }}
              style={{
                background: '#13635d', color: '#fff', border: 'none', padding: '12px 24px',
                borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px'
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
