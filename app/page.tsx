'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const token = localStorage.getItem('access_token')
    
    if (token) {
      // If logged in, redirect to dashboard
      router.push('/dashboard')
    } else {
      // If not logged in, redirect to login
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4 animate-pulse">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">VitalStep Admin</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
