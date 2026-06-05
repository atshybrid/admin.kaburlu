import { renderBlock12 } from '../src/renderBlock12.js'
import { SAMPLE_IMAGE_URLS } from '../src/sampleImages.js'

const seed =
  'ఈ రోజు జరిగిన సమావేశంలో అధికారులు ప్రజా హితాలను ప్రాధాన్యతగా పరిగణించాలని నిర్ణయించారు. స్థానిక సమస్యలపై చర్చ జరిగింది. '
let content = ''
while (content.split(/\s+/).filter(Boolean).length < 420) content += seed
content = content.split(/\s+/).slice(0, 420).join(' ')

const result = await renderBlock12({
  title: 'BLOCK-12A test',
  subtitle: '12in · 4 col',
  highlights: ['ఒకటి', 'రెండు', 'మూడు', 'నాలుగు'],
  image: SAMPLE_IMAGE_URLS,
  content,
})

console.log('valid:', result.valid)
if (!result.valid) {
  console.log('errors:', result.errors)
  process.exit(1)
}
console.log('words:', result.wordCount, 'height mm:', result.estimatedHeightMm)
console.log('images:', result.imageCount, 'top:', result.columnTopCount, 'bottom:', result.bottomImageCount)
console.log('html bytes:', result.html.length)
