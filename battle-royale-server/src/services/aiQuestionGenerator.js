import { config } from '../config.js'

const fallbackBank = [
  {
    text: 'Poytaxt bo`lgan shaharlarni yozing',
    category: 'geography',
    difficulty: 'medium',
    correctAnswers: ['toshkent', 'london', 'parij', 'berlin', 'madrid', 'rim', 'seul', 'tokio', 'ottava', 'ankara', 'moskva', 'bishkek'],
  },
  {
    text: 'Maktab buyumlarini yozing',
    category: 'school',
    difficulty: 'easy',
    correctAnswers: ['daftar', 'kitob', 'qalam', 'ruchka', 'sumka', 'doska', 'parta', 'marker', 'globus', 'o`chirg`ich', 'stul', 'qaychi'],
  },
  {
    text: 'Jamoaviy sport turlarini yozing',
    category: 'sports',
    difficulty: 'medium',
    correctAnswers: ['futbol', 'basketbol', 'voleybol', 'gandbol', 'xokkey', 'regbi', 'kriket', 'beysbol', 'futzal', 'polo'],
  },
]

const buildPrompt = ({ category, difficulty, answerTarget }) => `
Create one multiplayer quiz question with many correct short answers.
Return only JSON.
Format:
{
  "text": "question",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "correctAnswers": ["answer1", "answer2"]
}
Rules:
- Exactly one question.
- At least ${answerTarget} correct answers.
- Answers must be short, lowercase-friendly, and unique.
- The question must be fun for a classroom battle royale game.
`

export const generateAiQuestion = async ({ category, difficulty, answerTarget }) => {
  if (!config.openAiApiKey) {
    const fallback = fallbackBank.find((item) => (
      (category === 'any' || item.category === category)
      && item.difficulty === difficulty
    )) || fallbackBank[0]

    return {
      ...fallback,
      answerCount: fallback.correctAnswers.length,
      source: 'ai',
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You generate concise JSON for a multiplayer classroom game.',
        },
        {
          role: 'user',
          content: buildPrompt({ category, difficulty, answerTarget }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI request failed with ${response.status}`)
  }

  const payload = await response.json()
  const raw = payload.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  const correctAnswers = Array.isArray(parsed.correctAnswers)
    ? parsed.correctAnswers.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : []

  if (!parsed.text || correctAnswers.length < Math.max(6, answerTarget)) {
    throw new Error('AI returned invalid multi-answer question.')
  }

  return {
    text: String(parsed.text).trim(),
    category: String(parsed.category || category).trim(),
    difficulty: String(parsed.difficulty || difficulty).trim(),
    correctAnswers: Array.from(new Set(correctAnswers)),
    answerCount: Array.from(new Set(correctAnswers)).length,
    source: 'ai',
  }
}
