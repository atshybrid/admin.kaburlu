import LoginCard from '../components/LoginCard'
import AnimatedHeadline from '../components/AnimatedHeadline'
import Head from 'next/head'

export default function LoginPage() {
  return (
    <div className="min-h-screen newspaper-bg relative overflow-hidden animate-bg-drift">
      <Head>
        <title>Kaburlu Admin Login</title>
        <meta name="description" content="Secure Kaburlu media admin access" />
      </Head>
      <div className="grain-overlay" />
      <div className="absolute inset-0 flex flex-col lg:flex-row">
        <div className="flex-1 hidden lg:flex flex-col justify-center pl-24 pr-12">
          <div className="max-w-xl">
            <AnimatedHeadline />
            <p className="text-gray-600 text-base mt-10 mb-8 leading-relaxed">
              Kaburlu Media Admin gives you streamlined control over content, distribution and performance metrics. Log in to curate impactful regional news with precision.
            </p>
            <ul className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-8">
              <li className="flex items-start gap-2"><span className="text-brand">•</span> Real-time publishing</li>
              <li className="flex items-start gap-2"><span className="text-brand">•</span> Audience analytics</li>
              <li className="flex items-start gap-2"><span className="text-brand">•</span> Editorial workflow</li>
              <li className="flex items-start gap-2"><span className="text-brand">•</span> Secure access</li>
            </ul>
            <div className="text-xs text-gray-400">
              © {new Date().getFullYear()} Kaburlu Media. All rights reserved.
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 login-gradient relative">
          <div className="gradient-orb -top-40 -left-40" />
          <div className="gradient-orb bottom-0 right-0 scale-75" />
          <LoginCard />
        </div>
      </div>
    </div>
  )
}
