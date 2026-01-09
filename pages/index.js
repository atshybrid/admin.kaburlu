import { useEffect } from 'react'
import { useRouter } from 'next/router'
import LoginCard from '../components/LoginCard'
import AnimatedHeadline from '../components/AnimatedHeadline'
import Head from 'next/head'
import { getToken } from '../utils/auth'

export default function LoginPage() {
  const router = useRouter()

  // Redirect to admin if already logged in
  useEffect(() => {
    const token = getToken()
    if (token?.token) {
      router.replace('/admin')
    }
  }, [router])

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      <Head>
        <title>Kaburlu Admin Login</title>
        <meta name="description" content="Secure Kaburlu media admin access" />
      </Head>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-brand/20 via-purple-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-brand/15 via-blue-500/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="absolute inset-0 flex flex-col lg:flex-row">
        {/* Left Side - Branding */}
        <div className="flex-1 hidden lg:flex flex-col justify-center pl-16 xl:pl-24 pr-12 relative z-10">
          <div className="max-w-xl">
            <AnimatedHeadline />
            <p className="text-slate-600 text-base mt-8 mb-10 leading-relaxed">
              Kaburlu Media Admin gives you streamlined control over content, distribution and performance metrics. Log in to curate impactful regional news with precision.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              {[
                { icon: '📰', text: 'Real-time publishing' },
                { icon: '📊', text: 'Audience analytics' },
                { icon: '✍️', text: 'Editorial workflow' },
                { icon: '🔒', text: 'Enterprise security' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span>© {new Date().getFullYear()} Kaburlu Media</span>
              <span className="w-px h-4 bg-slate-200" />
              <span>All rights reserved</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
          {/* Mobile Header */}
          <div className="absolute top-6 left-6 lg:hidden">
            <div className="text-lg font-bold text-brand">Kaburlu</div>
            <div className="text-xs text-slate-500">Admin Portal</div>
          </div>
          <LoginCard />
        </div>
      </div>
    </div>
  )
}
