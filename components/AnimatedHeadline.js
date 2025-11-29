import { useEffect, useState } from 'react'

const words = ['News', 'Stories', 'Insight', 'Impact']

export default function AnimatedHeadline() {
  const [index, setIndex] = useState(0)
  const [subText, setSubText] = useState('')
  const fullSub = 'Curate regional content with precision.'

  // Rotate main word
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % words.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Typewriter for sub text
  useEffect(() => {
    let mounted = true
    let i = 0
    function type() {
      if (!mounted) return
      if (i <= fullSub.length) {
        setSubText(fullSub.slice(0, i))
        i++
        setTimeout(type, 45)
      }
    }
    type()
    return () => { mounted = false }
  }, [])

  return (
    <div className="select-none">
      <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
        <span className="text-brand">Manage</span>{' '}
        <span className="inline-block relative w-48">
          {words.map((w, i) => (
            <span
              key={w}
              className={`absolute left-0 top-0 transition-opacity duration-700 will-change-transform ${i === index ? 'opacity-100 animate-word-in' : 'opacity-0 animate-word-out'}`}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                {w}
              </span>
            </span>
          ))}
          <span className="invisible">{words[index]}</span>
        </span>
      </h1>
      <p className="mt-6 text-lg text-gray-600 min-h-[1.75rem] font-medium tracking-wide">
        {subText}<span className="inline-block w-3 -mb-[2px] h-5 align-middle bg-brand/60 animate-cursor" />
      </p>
    </div>
  )
}