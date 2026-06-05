import { renderBlock08 } from '../src/renderBlock08.js'

const seed =
  'ఈ రోజు జరిగిన సమావేశంలో అధికారులు ప్రజా హితాలను ప్రాధాన్యతగా పరిగణించాలని నిర్ణయించారు. స్థానిక సమస్యలపై విస్తృత చర్చ జరిగింది. '

function sample(n) {
  let out = ''
  while (out.split(/\s+/).filter(Boolean).length < n) out += seed
  return out.split(/\s+/).slice(0, n).join(' ')
}

const result = await renderBlock08({
  title: 'BLOCK-08A test',
  subtitle: '8in 3col',
  highlights: ['Point one', 'Point two'],
  image: [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  ],
  content: sample(260),
})

console.log('valid:', result.valid, 'words:', result.wordCount, 'h:', result.estimatedHeightMm)
if (!result.valid) console.log(result.errors)
else console.log('html length:', result.html.length)
