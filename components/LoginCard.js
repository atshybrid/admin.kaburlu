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

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'

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
      const res = await axios.post(`${apiBase}/api/v1/auth/login`, { mobileNumber, mpin }, { headers: { 'Content-Type': 'application/json' } })
      if (res.data && res.data.success) {
        const { jwt } = res.data.data
        saveToken(jwt, res.data.data)
        router.push('/dashboard')
      } else {
        setError(res.data?.message || 'Login failed')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className={`relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft brand-shadow p-8 transition duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <BrandLogo className="justify-center mb-6" size={80} showText={false} />
      <h1 className="text-xl font-semibold text-center mb-1">Welcome Back</h1>
      <p className="text-xs text-center text-gray-500 mb-6">Secure access to Kaburlu admin panel</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold tracking-wide text-gray-700">Mobile Number</label>
          <input
            required
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value)}
            placeholder="8282868389"
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white/80 p-3 text-sm focus:border-brand transition input-shimmer"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wide text-gray-700">MPIN</label>
          <input
            required
            value={mpin}
            onChange={e => setMpin(e.target.value)}
            type="password"
            placeholder="••••"
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white/80 p-3 text-sm focus:border-brand transition input-shimmer"
          />
        </div>
        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-brand text-white text-sm font-semibold tracking-wide hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
      <div className="mt-6 text-center text-[10px] text-gray-400">
        Environment: Prod API | v1
      </div>
    </div>
  )
}