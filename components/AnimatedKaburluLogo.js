import { useState, useEffect } from 'react'

const KABURLU_LOGOS = [
  { src: '/kaburlu_svg/telugu.svg', lang: 'Telugu' },
  { src: '/kaburlu_svg/english.svg', lang: 'English' },
  { src: '/kaburlu_svg/hindi.svg', lang: 'Hindi' },
  { src: '/kaburlu_svg/kannada.svg', lang: 'Kannada' },
  { src: '/kaburlu_svg/tamil.svg', lang: 'Tamil' },
]

export default function AnimatedKaburluLogo({ 
  className = '', 
  size = 72, 
  interval = 2500,
  showLanguageLabel = false 
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true)
      
      // Wait for fade out, then change image
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % KABURLU_LOGOS.length)
        setIsAnimating(false)
      }, 300) // Half of transition duration
    }, interval)

    return () => clearInterval(timer)
  }, [interval])

  const currentLogo = KABURLU_LOGOS[currentIndex]

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Container with Animation */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand-dark/20 rounded-2xl blur-xl animate-pulse"
          style={{ transform: 'scale(1.2)' }}
        />
        
        {/* Main logo */}
        <div 
          className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ease-in-out ${
            isAnimating 
              ? 'opacity-0 scale-90 rotate-3' 
              : 'opacity-100 scale-100 rotate-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentLogo.src}
            alt={`Kaburlu Logo - ${currentLogo.lang}`}
            className="w-full h-full object-contain drop-shadow-lg"
            style={{ 
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            }}
          />
        </div>
      </div>



      {/* Optional language label */}
      {showLanguageLabel && (
        <span 
          className={`mt-2 text-xs font-medium text-slate-500 transition-all duration-300 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentLogo.lang}
        </span>
      )}
    </div>
  )
}
