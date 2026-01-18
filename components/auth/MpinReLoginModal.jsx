import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { saveToken } from '../../utils/auth'

export default function MpinReLoginModal({ isOpen, onClose, onSuccess }) {
  const router = useRouter()
  const [mpin, setMpin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(300) // 5 minutes

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Force logout after countdown
          localStorage.removeItem('kab_admin_auth')
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, router])

  const handleMpinSubmit = async (e) => {
    e.preventDefault()
    
    if (!mpin || mpin.length !== 4) {
      setError('Please enter 4-digit MPIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get stored user data
      const authData = localStorage.getItem('kab_admin_auth')
      const userData = authData ? JSON.parse(authData) : null
      const mobile = userData?.user?.mobile || userData?.data?.user?.mobile

      if (!mobile) {
        throw new Error('Mobile number not found. Please login again.')
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, mpin })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Invalid MPIN')
      }

      const result = await response.json()
      
      // Handle API response structure: { success: true, data: { jwt, refreshToken, user } }
      if (result.success && result.data?.jwt) {
        saveToken(result.data.jwt, result.data)
        setError('')
        setMpin('')
        if (onSuccess) onSuccess()
        if (onClose) onClose()
      } else if (result.jwt || result.token) {
        // Fallback for different response structure
        saveToken(result.jwt || result.token, result)
        setError('')
        setMpin('')
        if (onSuccess) onSuccess()
        if (onClose) onClose()
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      setError(err.message || 'Failed to re-login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('kab_admin_auth')
    router.push('/')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-sm text-gray-600">Your session has expired. Please enter your MPIN to continue.</p>
          <div className="mt-3 inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            ⏱ {formatTime(countdown)}
          </div>
        </div>

        <form onSubmit={handleMpinSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter 4-digit MPIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={mpin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setMpin(value)
                setError('')
              }}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Logout
            </button>
            <button
              type="submit"
              disabled={loading || mpin.length !== 4}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : 'Continue'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            For security reasons, you&apos;ll be logged out after the countdown ends.
          </p>
        </div>
      </div>
    </div>
  )
}
