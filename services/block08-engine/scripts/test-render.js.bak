import { renderBlock06 } from '../src/renderBlock06.js'

function sampleWords(n) {
  const s =
    'ఈ రోజు జరిగిన సమావేశంలో అధికారులు ప్రజా హితాలను ప్రాధాన్యతగా పరిగణించాలని నిర్ణయించారు. స్థానిక సమస్యలపై విస్తృత చర్చ జరిగింది. '
  let out = ''
  while (out.split(/\s+/).filter(Boolean).length < n) out += s
  return out.split(/\s+/).slice(0, n).join(' ')
}

const result = await renderBlock06({
  title: 'బ్లాక్-06A టెస్ట్ శీర్షిక: స్థానిక అభివృద్ధి',
  subtitle: 'ఉపశీర్షిక డెమో',
  highlights: ['మొదటి పాయింట్', 'రెండవ పాయింట్'],
  image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600',
  content: sampleWords(220),
})

console.log(JSON.stringify({
  valid: result.valid,
  wordCount: result.wordCount,
  estimatedHeightMm: result.estimatedHeightMm,
  errors: result.errors,
  htmlLength: result.html?.length,
}, null, 2))

if (!result.valid) process.exit(1)
