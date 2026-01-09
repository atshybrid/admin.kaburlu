import { useState, useEffect } from 'react'
import axios from 'axios'
import { saveToken } from '../utils/auth'
import { useRouter } from 'next/router'
import BrandLogo from './BrandLogo'

export default function LoginCard() {
  const router = useRouter()
  const [mobileNumber, setMobileNumber] = useState('')
  const [mpin, setMpin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMpin, setShowMpin] = useState(false)

  // Use local API proxy to avoid CORS issues
  const loginUrl = '/api/auth/login'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Enter valid 10 digit mobile number')
      return
    }
    if (!/^\d{4,6}$/.test(mpin)) {
      setError('MPIN must be 4-6 digits')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(loginUrl, { mobileNumber, mpin }, { headers: { 'Content-Type': 'application/json' } })
      if (res.data && res.data.success) {
        const { jwt } = res.data.data
        saveToken(jwt, res.data.data)
        router.push('/admin')
      } else {
        setError(res.data?.message || 'Login failed')
      }
    } catch (err) {
      const status = err?.response?.status
      const data = err?.response?.data
      const backendMessage = data?.message || data?.error || (typeof data === 'string' ? data : '')
      const fallback = err?.message || 'Network error'
      setError(status ? `${status}: ${backendMessage || fallback}` : (backendMessage || fallback))
    } finally {
      setLoading(false)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className={`relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 p-8 transition duration-700 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <BrandLogo className="justify-center mb-4" size={72} showText={false} />
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to your admin dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mobile Number Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <input
              required
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit number"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        {/* MPIN Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            MPIN
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <input
              required
              value={mpin}
              onChange={e => setMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type={showMpin ? 'text' : 'password'}
              placeholder="4-6 digit MPIN"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowMpin(!showMpin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showMpin ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 animate-fadeIn">
            <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-white text-sm font-semibold tracking-wide hover:shadow-lg hover:shadow-brand/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400">
          Protected by enterprise-grade security
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-300">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span>System Online</span>
        </div>
      </div>
    </div>
  )
}