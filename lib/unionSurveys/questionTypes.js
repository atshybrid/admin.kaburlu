/** Survey question builder — UI state ↔ API payload */

export const QUESTION_TYPES = [
  {
    value: 'SINGLE_CHOICE',
    label: 'Single choice',
    hint: 'Member picks one option (parties, candidates, etc.)',
    hasOptions: true,
  },
  {
    value: 'YES_NO',
    label: 'Yes / No',
    hint: 'Simple confirmation question',
    hasOptions: false,
  },
  {
    value: 'VIDEO_UPLOAD',
    label: 'Video upload',
    hint: 'Record video with survey frame overlay',
    hasOptions: false,
    hasVideo: true,
  },
  {
    value: 'TEXT',
    label: 'Text answer',
    hint: 'Short written response',
    hasOptions: false,
  },
]

export function newOption(partial = {}) {
  return {
    _key: `o_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    id: partial.id || '',
    label: partial.label || '',
    color: partial.color || '#64748b',
    symbolUrl: partial.symbolUrl || '',
  }
}

export function newQuestion(questionType = 'SINGLE_CHOICE', sortOrder = 0) {
  const type = QUESTION_TYPES.find((t) => t.value === questionType) ? questionType : 'SINGLE_CHOICE'
  return {
    _key: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    questionType: type,
    questionText: '',
    nativeQuestionText: '',
    required: true,
    sortOrder,
    videoMaxSeconds: 30,
    options: type === 'SINGLE_CHOICE' ? [newOption(), newOption()] : [],
  }
}

/** Default = one question only. Video is optional (step 2 checkbox or + Video button). */
export function defaultQuestionsForSurveyType(surveyType) {
  return starterQuestionsForSurveyType(surveyType)
}

export function starterQuestionsForSurveyType(surveyType) {
  if (surveyType === 'POLITICAL_PARTY') {
    return [
      {
        ...newQuestion('YES_NO', 0),
        questionText: 'Are you an ex-member of this party?',
        nativeQuestionText: 'మీరు ఈ పార్టీ మాజీ సభ్యుడా?',
      },
    ]
  }
  return [
    {
      ...newQuestion('SINGLE_CHOICE', 0),
      questionText: '2026 lo ee party gelustundi?',
      nativeQuestionText: '2026 లో ఏ పార్టీ గెలుస్తుంది?',
      options: [
        newOption({ id: 'BJP', label: 'BJP', color: '#FF9933' }),
        newOption({ id: 'BRS', label: 'BRS', color: '#E91E63' }),
      ],
    },
  ]
}

export function videoQuestionTemplate() {
  return {
    ...newQuestion('VIDEO_UPLOAD', 99),
    questionText: 'Record video with party frame',
    nativeQuestionText: 'పార్టీ ఫ్రేమ్ తో వీడియో రికార్డ్ చేయండి',
    videoMaxSeconds: 30,
  }
}

export function syncVideoQuestion(questions, includeVideo) {
  const list = (questions || []).filter((q) => q.questionType !== 'VIDEO_UPLOAD')
  if (!includeVideo) return list
  return [...list, { ...videoQuestionTemplate(), sortOrder: list.length }]
}

export function hasVideoQuestion(questions) {
  return (questions || []).some((q) => q.questionType === 'VIDEO_UPLOAD')
}

/** API payload for POST /journalist/admin/surveys */
export function serializeQuestions(questions) {
  const list = Array.isArray(questions) ? questions : []
  return list.map((q, index) => {
    const base = {
      questionType: q.questionType,
      questionText: String(q.questionText || '').trim(),
      required: q.required !== false,
      sortOrder: index,
    }
    const native = String(q.nativeQuestionText || '').trim()
    if (native) base.nativeQuestionText = native

    if (q.questionType === 'VIDEO_UPLOAD') {
      base.videoMaxSeconds = Math.min(120, Math.max(5, Number(q.videoMaxSeconds) || 30))
    }

    if (q.questionType === 'SINGLE_CHOICE' && Array.isArray(q.options)) {
      base.options = q.options
        .filter((o) => String(o.label || o.id || '').trim())
        .map((o) => {
          const label = String(o.label || o.id).trim()
          const id = String(o.id || label)
            .trim()
            .replace(/\s+/g, '_')
            .toUpperCase()
          const opt = { id, label }
          if (o.color) opt.color = o.color
          if (String(o.symbolUrl || '').trim()) opt.symbolUrl = String(o.symbolUrl).trim()
          return opt
        })
    }

    return base
  })
}

export function validateQuestions(questions) {
  const list = Array.isArray(questions) ? questions : []
  if (!list.length) return 'Add at least one question'

  for (let i = 0; i < list.length; i++) {
    const q = list[i]
    if (!String(q.questionText || '').trim()) {
      return `Question ${i + 1}: enter question text`
    }
    if (q.questionType === 'SINGLE_CHOICE') {
      const opts = (q.options || []).filter((o) => String(o.label || o.id || '').trim())
      if (opts.length < 2) {
        return `Question ${i + 1}: add at least 2 answer options`
      }
    }
  }
  return null
}
