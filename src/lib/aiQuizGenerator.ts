import { createGameQuestion, type CreateBackendQuestionPayload } from './backend.ts'

export type AiQuizDifficulty = 'easy' | 'medium' | 'hard'

export type AiGeneratedQuestion = {
  question: string
  options: [string, string, string, string]
  correct: string
  correctIndex: number
  difficulty: AiQuizDifficulty
}

export type AiGeneratedPayload = {
  sinf?: string
  fan: string
  mavzu: string
  daraja: AiQuizDifficulty
  tests: AiGeneratedQuestion[]
}

export type AiCurriculumTopicsPayload = {
  sinf: string
  fan: string
  mavzular: string[]
}

export type AiQuizGenerationRules = {
  questionDomain?: 'general' | 'math'
  optionsMustBeIntegers?: boolean
  correctMustBeInteger?: boolean
  integerRange?: {
    min: number
    max: number
  }
  extraPromptRules?: string[]
}

type AiProvider = 'ollama' | 'gemini'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

type OllamaGenerateResponse = {
  response?: string
  error?: string
}

type ImportAiQuestionsOptions<LocalItem> = {
  existingItems: LocalItem[]
  generated: AiGeneratedPayload
  makeExistingKey: (item: LocalItem) => string
  makeGeneratedKey: (test: AiGeneratedQuestion, payload: AiGeneratedPayload) => string
  createPayload: (test: AiGeneratedQuestion, payload: AiGeneratedPayload) => CreateBackendQuestionPayload
  toLocalItem: (test: AiGeneratedQuestion, payload: AiGeneratedPayload, createdId: string) => LocalItem
}

export type ImportAiQuestionsResult<LocalItem> = {
  items: LocalItem[]
  skippedCount: number
  failedCount: number
  errors: string[]
}

const AI_PROVIDER = (import.meta.env.VITE_AI_PROVIDER ?? 'gemini').trim().toLowerCase() as AiProvider
const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/+$/, '')
const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL ?? 'qwen2.5:7b').trim()
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY ?? 'AIzaSyBNcEn5GAJkXrB_2C8DZD2xMuHSv2WB9n4').trim()
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash').trim()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeAiDifficulty = (value: unknown): AiQuizDifficulty | null => {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value
  return null
}

const describeIntegerRange = (range?: AiQuizGenerationRules['integerRange']) => {
  if (!range) return "butun son bo'lsin"
  if (range.min === range.max) return `${range.min} ga teng butun son bo'lsin`
  return `${range.min} dan ${range.max} gacha bo'lgan butun son bo'lsin`
}

const parseIntegerCandidate = (
  value: string,
  range?: AiQuizGenerationRules['integerRange'],
): number | null => {
  const cleaned = value.trim()
  if (!/^-?\d+$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  if (!Number.isInteger(parsed)) return null
  if (range && (parsed < range.min || parsed > range.max)) return null
  return parsed
}

const buildAiPrompt = (
  sinf: string | undefined,
  fan: string,
  mavzu: string,
  daraja: AiQuizDifficulty,
  savollarSoni: number,
  rules?: AiQuizGenerationRules,
  retryFeedback?: string,
) => {
  const extraRules: string[] = []
  if (rules?.questionDomain === 'math') {
    extraRules.push("- Savollar faqat matematika yoki arifmetika savollari bo'lsin.")
  }
  if (rules?.optionsMustBeIntegers) {
    extraRules.push(`- Har bir savoldagi 4 ta optionning har biri faqat ${describeIntegerRange(rules.integerRange)}. Variant ichida matn, birlik yoki izoh yozma.`)
  }
  if (rules?.correctMustBeInteger) {
    extraRules.push(`- \"correct\" qiymati faqat ${describeIntegerRange(rules.integerRange)} va optionlardan aynan bittasiga mos bo'lsin.`)
  }
  if (rules?.extraPromptRules?.length) {
    rules.extraPromptRules.forEach((rule) => {
      const trimmed = rule.trim()
      if (trimmed) extraRules.push(`- ${trimmed}`)
    })
  }
  if (retryFeedback) {
    extraRules.push(`- Oldingi javob xatosi: ${retryFeedback}. Shu xatoni takrorlama.`)
  }

  return `SEN - professional test generator AI san.

Vazifa:
Foydalanuvchi bergan ${sinf ? 'SINF, ' : ''}FAN, MAVZU va SAVOLLAR SONI asosida aniq testlar yaratish.

QAT'IY QOIDALAR:

1. Javob faqat O'ZBEK tilida bo'lsin.
2. FAQAT JSON format chiqar.
3. Hech qanday izoh, tushuntirish yoki matn yozma.
4. Har savolda:
   * question (savol matni)
   * options (4 ta variant)
   * correct (to'g'ri javob)
   * difficulty ("easy" | "medium" | "hard")
5. Variantlar mantiqan to'g'ri va chalkashtiruvchi bo'lsin.
6. Savollar takrorlanmasin.
7. Fakt xatolik bo'lmasin.
8. O'quvchilar uchun tushunarli bo'lsin.
9. JSON VALID bo'lishi shart.

FORMAT:

[
  {
    "question": "Savol matni",
    "options": ["A", "B", "C", "D"],
    "correct": "To'g'ri javob",
    "difficulty": "${daraja}"
  }
]

KIRITISH FORMATINI TUSHUN:

${sinf ? `Sinf: ${sinf}\n` : ''}Fan: ${fan}
Mavzu: ${mavzu}
Savollar: ${savollarSoni}

Qo'shimcha talablar:
- Natija aynan ${savollarSoni} ta test bo'lsin.
- Har bir savolda difficulty qiymati "${daraja}" bo'lsin.
- "correct" qiymati shu savoldagi 4 ta option ichidan aynan bittasiga teng bo'lsin.
- ${sinf ? `${sinf} darajasiga mos savollar bo'lsin.` : "Savollar fan va mavzuga aniq mos bo'lsin."}
- Hech qanday markdown, kod blok, sarlavha yoki izoh qo'shma.
- Faqat JSON massiv qaytar.
${extraRules.join('\n')}`
}

const buildAiTopicPrompt = (
  sinf: string,
  fan: string,
  retryFeedback?: string,
) => `SEN - maktab o'quv dasturi mavzu generator AI san.

Vazifa:
Berilgan SINF va FAN uchun O'zbekiston umumiy o'rta ta'lim darsliklari va milliy o'quv dasturiga mos asosiy mavzular ro'yxatini tuz.

QAT'IY QOIDALAR:
1. Javob faqat O'ZBEK tilida bo'lsin.
2. FAQAT JSON format chiqar.
3. Hech qanday izoh, tushuntirish yoki qo'shimcha matn yozma.
4. Faqat shu sinf va shu fan uchun mos mavzularni qaytar.
5. Mavzular takrorlanmasin.
6. Mavzu nomlari qisqa, aniq va o'quvchi tushunadigan bo'lsin.
7. Bir yillik asosiy mavzularni qamrab oladigan ro'yxat bo'lsin.

FORMAT:
{
  "sinf": "${sinf}",
  "fan": "${fan}",
  "mavzular": [
    "1-mavzu",
    "2-mavzu",
    "3-mavzu"
  ]
}

KIRITISH:
Sinf: ${sinf}
Fan: ${fan}

Qo'shimcha talablar:
- "mavzular" ichida kamida 12 ta va ko'pi bilan 24 ta mavzu bo'lsin.
- Mavzular tartibli, yillik ketma-ketlikka yaqin va darslik mavzulariga mos bo'lsin.
- Faqat JSON object qaytar.
${retryFeedback ? `- Oldingi javob xatosi: ${retryFeedback}. Shu xatoni takrorlama.` : ''}`

const getAiProvider = (): AiProvider => (AI_PROVIDER === 'gemini' ? 'gemini' : 'ollama')

const readGeminiText = (payload: GeminiResponse) =>
  (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()

const requestGeminiText = async (prompt: string) => {
  if (!GEMINI_API_KEY) {
    throw new Error("AI Studio API kaliti topilmadi. `.env` ichiga `VITE_GEMINI_API_KEY` qo'ying.")
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  const payload = await response.json() as GeminiResponse
  if (!response.ok) {
    throw new Error(payload.error?.message || "AI so'rovi bajarilmadi.")
  }

  const text = readGeminiText(payload)
  if (!text) {
    throw new Error("AI bo'sh javob qaytardi.")
  }

  return text
}

const requestOllamaText = async (prompt: string) => {
  let response: Response
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      }),
    })
  } catch {
    throw new Error("Ollama serveriga ulanib bo'lmadi. Avval `ollama serve` ni ishga tushiring.")
  }

  const payload = await response.json() as OllamaGenerateResponse
  if (!response.ok) {
    throw new Error(payload.error || "Ollama so'rovi bajarilmadi.")
  }

  const text = typeof payload.response === 'string' ? payload.response.trim() : ''
  if (!text) {
    throw new Error("Ollama bo'sh javob qaytardi. `ollama pull` bilan modelni yuklab ko'ring.")
  }

  return text
}

const requestAiText = async (prompt: string) => {
  if (getAiProvider() === 'gemini') {
    return requestGeminiText(prompt)
  }
  return requestOllamaText(prompt)
}

const extractJsonPayload = (text: string) => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  const firstSquare = cleaned.indexOf('[')
  const firstBrace = cleaned.indexOf('{')
  const firstToken = [firstSquare, firstBrace].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? -1
  const lastSquare = cleaned.lastIndexOf(']')
  const lastBrace = cleaned.lastIndexOf('}')
  const lastToken = Math.max(lastSquare, lastBrace)

  if (firstToken === -1 || lastToken === -1 || lastToken < firstToken) {
    throw new Error("AI javobidan JSON topilmadi.")
  }

  return cleaned.slice(firstToken, lastToken + 1)
}

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()

const normalizeAiPayload = (
  payload: unknown,
  fallback: { sinf?: string, fan: string, mavzu: string, daraja: AiQuizDifficulty, savollarSoni: number },
  rules?: AiQuizGenerationRules,
): AiGeneratedPayload => {
  const rawTests = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.tests)
      ? payload.tests
      : null

  if (!rawTests) {
    throw new Error("AI javobida tests ro'yxati yo'q.")
  }

  if (rawTests.length !== fallback.savollarSoni) {
    throw new Error(`AI ${fallback.savollarSoni} ta savol qaytarishi kerak.`)
  }

  const seenQuestions = new Set<string>()

  const tests = rawTests.map((rawTest, index) => {
    if (!isRecord(rawTest)) {
      throw new Error(`${index + 1}-savol formati noto'g'ri.`)
    }

    const question = typeof rawTest.question === 'string' ? rawTest.question.trim() : ''
    if (!question) {
      throw new Error(`${index + 1}-savol matni bo'sh.`)
    }

    const questionKey = normalizeText(question)
    if (seenQuestions.has(questionKey)) {
      throw new Error('AI dublikat savollar qaytardi.')
    }
    seenQuestions.add(questionKey)

    const rawOptions = rawTest.options
    if (!Array.isArray(rawOptions) || rawOptions.length !== 4) {
      throw new Error(`${index + 1}-savolda 4 ta variant bo'lishi shart.`)
    }

    const options = rawOptions.map((item) => String(item ?? '').trim())
    if (options.some((item) => !item)) {
      throw new Error(`${index + 1}-savolda bo'sh variant bor.`)
    }

    if (new Set(options.map(normalizeText)).size !== 4) {
      throw new Error(`${index + 1}-savolda variantlar takrorlangan.`)
    }

    const correctRaw = typeof rawTest.correct === 'string' || typeof rawTest.correct === 'number'
      ? String(rawTest.correct).trim()
      : ''
    if (!correctRaw) {
      throw new Error(`${index + 1}-savolda correct maydoni bo'sh.`)
    }

    const correctIndex = options.findIndex((item) => normalizeText(item) === normalizeText(correctRaw))
    if (correctIndex < 0) {
      throw new Error(`${index + 1}-savolda correct qiymati variantlardan biriga mos emas.`)
    }

    if (rules?.optionsMustBeIntegers) {
      const invalidOption = options.find((item) => parseIntegerCandidate(item, rules.integerRange) === null)
      if (invalidOption) {
        throw new Error(`${index + 1}-savolda barcha variantlar faqat ${describeIntegerRange(rules.integerRange)} kerak.`)
      }
    }

    if (rules?.correctMustBeInteger && parseIntegerCandidate(options[correctIndex], rules.integerRange) === null) {
      throw new Error(`${index + 1}-savolda to'g'ri javob faqat ${describeIntegerRange(rules.integerRange)} kerak.`)
    }

    const difficulty = normalizeAiDifficulty(rawTest.difficulty) ?? fallback.daraja

    return {
      question,
      options: [options[0], options[1], options[2], options[3]] as [string, string, string, string],
      correct: options[correctIndex],
      correctIndex,
      difficulty,
    }
  })

  const sinf = isRecord(payload) && typeof payload.sinf === 'string' && payload.sinf.trim() ? payload.sinf.trim() : fallback.sinf
  const fan = isRecord(payload) && typeof payload.fan === 'string' && payload.fan.trim() ? payload.fan.trim() : fallback.fan
  const mavzu = isRecord(payload) && typeof payload.mavzu === 'string' && payload.mavzu.trim() ? payload.mavzu.trim() : fallback.mavzu
  const daraja = isRecord(payload) ? normalizeAiDifficulty(payload.daraja) ?? fallback.daraja : fallback.daraja

  return { sinf, fan, mavzu, daraja, tests }
}

const normalizeAiTopicPayload = (
  payload: unknown,
  fallback: { sinf: string, fan: string },
): AiCurriculumTopicsPayload => {
  if (!isRecord(payload)) {
    throw new Error("AI mavzu javobi noto'g'ri formatda keldi.")
  }

  const sinf = typeof payload.sinf === 'string' && payload.sinf.trim() ? payload.sinf.trim() : fallback.sinf
  const fan = typeof payload.fan === 'string' && payload.fan.trim() ? payload.fan.trim() : fallback.fan
  const rawTopics = Array.isArray(payload.mavzular)
    ? payload.mavzular
    : Array.isArray(payload.topics)
      ? payload.topics
      : null

  if (!rawTopics) {
    throw new Error("AI javobida mavzular ro'yxati topilmadi.")
  }

  const uniqueTopics: string[] = []
  const seen = new Set<string>()
  rawTopics.forEach((topic) => {
    const normalized = String(topic ?? '').trim()
    if (normalized.length < 3) return
    const key = normalizeText(normalized)
    if (seen.has(key)) return
    seen.add(key)
    uniqueTopics.push(normalized)
  })

  if (uniqueTopics.length < 6) {
    throw new Error("AI yetarli mavzu qaytarmadi.")
  }

  return {
    sinf,
    fan,
    mavzular: uniqueTopics.slice(0, 24),
  }
}

export const mapAiDifficultyToUzbek = (value: string): 'Oson' | "O'rta" | 'Qiyin' => {
  if (value === 'easy') return 'Oson'
  if (value === 'hard') return 'Qiyin'
  return "O'rta"
}

export const generateAiQuizBatch = async (params: {
  sinf?: string
  fan: string
  mavzu: string
  daraja: AiQuizDifficulty
  savollarSoni: number
  rules?: AiQuizGenerationRules
}): Promise<AiGeneratedPayload> => {
  const sinf = params.sinf?.trim()
  const fan = params.fan.trim()
  const mavzu = params.mavzu.trim()

  if (!fan || !mavzu) {
    throw new Error("Fan va mavzu maydonlarini to'ldiring.")
  }

  if (!Number.isInteger(params.savollarSoni) || params.savollarSoni < 1 || params.savollarSoni > 10) {
    throw new Error("Savollar soni 1 dan 10 gacha bo'lishi kerak.")
  }

  let retryFeedback = ''

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let text = ''
    try {
      text = await requestAiText(buildAiPrompt(sinf, fan, mavzu, params.daraja, params.savollarSoni, params.rules, retryFeedback))
    } catch (error) {
      retryFeedback = error instanceof Error ? error.message : "AI bo'sh javob qaytardi"
      if (attempt === 2) throw error
      continue
    }

    try {
      return normalizeAiPayload(JSON.parse(extractJsonPayload(text)) as unknown, {
        sinf,
        fan,
        mavzu,
        daraja: params.daraja,
        savollarSoni: params.savollarSoni,
      }, params.rules)
    } catch (error) {
      retryFeedback = error instanceof Error ? error.message : "AI javobi noto'g'ri formatda keldi"
      if (attempt === 2) {
        throw error instanceof Error ? error : new Error("AI javobini o'qib bo'lmadi.")
      }
    }
  }

  throw new Error("AI savollarini yaratib bo'lmadi.")
}

export const generateAiCurriculumTopics = async (params: {
  sinf: string
  fan: string
}): Promise<AiCurriculumTopicsPayload> => {
  const sinf = params.sinf.trim()
  const fan = params.fan.trim()

  if (!sinf || !fan) {
    throw new Error("Sinf va fan tanlanishi kerak.")
  }

  let retryFeedback = ''

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let text = ''
    try {
      text = await requestAiText(buildAiTopicPrompt(sinf, fan, retryFeedback))
    } catch (error) {
      retryFeedback = error instanceof Error ? error.message : "AI bo'sh javob qaytardi"
      if (attempt === 2) throw error
      continue
    }

    try {
      return normalizeAiTopicPayload(JSON.parse(extractJsonPayload(text)) as unknown, { sinf, fan })
    } catch (error) {
      retryFeedback = error instanceof Error ? error.message : "AI mavzu javobi noto'g'ri formatda keldi"
      if (attempt === 2) {
        throw error instanceof Error ? error : new Error("AI mavzularni o'qib bo'lmadi.")
      }
    }
  }

  throw new Error("AI mavzularni topib bo'lmadi.")
}

export const importAiGeneratedQuestions = async <LocalItem>(
  options: ImportAiQuestionsOptions<LocalItem>,
): Promise<ImportAiQuestionsResult<LocalItem>> => {
  const existingKeys = new Set(options.existingItems.map(options.makeExistingKey))
  const batchKeys = new Set<string>()
  const items: LocalItem[] = []
  const errors: string[] = []
  let skippedCount = 0

  for (const test of options.generated.tests) {
    const key = options.makeGeneratedKey(test, options.generated)
    if (existingKeys.has(key) || batchKeys.has(key)) {
      skippedCount += 1
      continue
    }

    batchKeys.add(key)

    try {
      const created = await createGameQuestion(options.createPayload(test, options.generated))
      items.push(options.toLocalItem(test, options.generated, created.id))
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
    }
  }

  return {
    items,
    skippedCount,
    failedCount: errors.length,
    errors,
  }
}
