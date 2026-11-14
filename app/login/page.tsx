// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@vitalstep.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              background: '#4f46e5',
              borderRadius: '9999px',
              marginBottom: '1rem'
            }}>
              <LogIn color="white" size={32} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>VitalStep</h1>
            <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>Admin Dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <AlertCircle color="#dc2626" size={20} style={{ flexShrink: 0 }} />
              <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="admin@vitalstep.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#9ca3af' : '#4f46e5',
                color: 'white',
                fontWeight: '600',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#4338ca')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#4f46e5')}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            VitalStep Manufacturing Admin
          </p>
        </div>
      </div>
    </div>
  )
}

