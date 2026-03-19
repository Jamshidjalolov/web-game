import { useEffect, useMemo, useState } from 'react'
import AiQuizImportPanel from '../components/AiQuizImportPanel.tsx'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import TeacherFeatureNotice from '../components/TeacherFeatureNotice.tsx'
import { findGameById } from '../data/games.ts'
import useTeacherGameAccess from '../hooks/useTeacherGameAccess.ts'
import {
  mapAiDifficultyToUzbek,
  type AiGeneratedQuestion,
  type AiGeneratedPayload,
  type AiQuizDifficulty,
  type AiQuizGenerationRules,
} from '../lib/aiQuizGenerator.ts'
import {
  createGameQuestion,
  deleteGameQuestion,
  fetchGameQuestions,
  type BackendQuestion,
  type CreateBackendQuestionPayload,
} from '../lib/backend.ts'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type EditorMode = 'multiple_choice' | 'word_pair' | 'word_hint' | 'prompt_only' | 'answers_bank'
type GameId =
  | 'baraban-metodi'
  | 'box-jang'
  | 'car-racing-math'
  | 'tezkor-hisob'
  | 'arqon-tortish'
  | 'millioner'
  | 'jumanji'
  | 'topqirlik-kvest'
  | 'quiz-battle'
  | 'one-question-100-answers'
  | 'inglizcha-soz'
  | 'jumla-ustasi'

type TopicValue = '+' | '-' | '*' | '/' | 'x'
type TopicOption = { value: TopicValue; label: string }

type GameConfig = {
  id: GameId
  editor: EditorMode
  defaultFan: string
  defaultMavzu: string
  aiDescription: string
  questionLimit: number
  topicOptions?: TopicOption[]
  generatorRules?: AiQuizGenerationRules
  allowHint?: boolean
  allowPoints?: boolean
}

type FormState = {
  difficulty: Difficulty
  topic: TopicValue
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  hint: string
  points: number
  en: string
  uz: string
  word: string
  answersText: string
}

const TOPIC_OPTIONS: TopicOption[] = [
  { value: '+', label: "Qo'shish (+)" },
  { value: '-', label: 'Ayirish (-)' },
  { value: '*', label: "Ko'paytirish (*)" },
  { value: 'x', label: "Ko'paytirish (x)" },
  { value: '/', label: "Bo'lish (/)" },
]

const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'millioner',
    editor: 'multiple_choice',
    defaultFan: 'umumiy bilim',
    defaultMavzu: 'millioner uslubidagi 4 variantli savollar',
    aiDescription: "AI yaratgan testlar shu o'yinning teacher savollariga saqlanadi.",
    questionLimit: 120,
  },
  {
    id: 'box-jang',
    editor: 'multiple_choice',
    defaultFan: 'matematika',
    defaultMavzu: "tezkor 4 variantli matematik savollar",
    aiDescription: "AI yaratgan testlar shu boks o'yinining teacher bankiga saqlanadi.",
    questionLimit: 120,
  },
  {
    id: 'car-racing-math',
    editor: 'multiple_choice',
    defaultFan: 'matematika',
    defaultMavzu: "tezkor matematik misollar",
    aiDescription: "AI yaratgan misollar tanlangan amal bilan poyga bankiga saqlanadi.",
    questionLimit: 120,
    topicOptions: TOPIC_OPTIONS.filter((item) => item.value !== 'x'),
  },
  {
    id: 'tezkor-hisob',
    editor: 'multiple_choice',
    defaultFan: 'matematika',
    defaultMavzu: "tezkor matematik misollar",
    aiDescription: "AI yaratgan misollar tanlangan amal bilan tezkor hisob bankiga saqlanadi.",
    questionLimit: 120,
    topicOptions: TOPIC_OPTIONS.filter((item) => item.value !== 'x'),
  },
  {
    id: 'arqon-tortish',
    editor: 'multiple_choice',
    defaultFan: 'matematika',
    defaultMavzu: "butun son javobli arifmetik savollar",
    aiDescription: "AI faqat butun son javobli savollar yaratadi va arqon tortish bankiga saqlanadi.",
    questionLimit: 200,
    topicOptions: TOPIC_OPTIONS.filter((item) => item.value !== '*'),
    generatorRules: {
      questionDomain: 'math',
      optionsMustBeIntegers: true,
      correctMustBeInteger: true,
      integerRange: { min: 0, max: 999 },
      extraPromptRules: [
        "Har bir savolning bitta aniq to'g'ri javobi bo'lsin.",
        "Agar bo'lish savoli tuzsang, javob qoldiqsiz butun son chiqsin.",
        "Variantlarga boshqa qo'shimcha matn yozma.",
      ],
    },
  },
  {
    id: 'jumanji',
    editor: 'multiple_choice',
    defaultFan: 'umumiy bilim',
    defaultMavzu: 'sarguzasht uslubidagi 4 variantli savollar',
    aiDescription: "AI yaratgan testlar Jumanji savollar bankiga qo'shiladi.",
    questionLimit: 140,
    allowHint: true,
  },
  {
    id: 'topqirlik-kvest',
    editor: 'multiple_choice',
    defaultFan: 'mantiq',
    defaultMavzu: 'topqirlik va mantiqiy savollar',
    aiDescription: "AI yaratgan testlar kvest uchun teacher savol sifatida saqlanadi.",
    questionLimit: 120,
  },
  {
    id: 'quiz-battle',
    editor: 'multiple_choice',
    defaultFan: 'umumiy bilim',
    defaultMavzu: 'quiz battle kartalari uchun savollar',
    aiDescription: "AI yaratgan testlar Quiz Battle kartalari sifatida saqlanadi.",
    questionLimit: 120,
    allowPoints: true,
  },
  {
    id: 'one-question-100-answers',
    editor: 'answers_bank',
    defaultFan: 'umumiy bilim',
    defaultMavzu: 'ko`p javobli team battle savollari',
    aiDescription: 'Teacher ko`p javobli savollar shu bankda saqlanadi va battle royale arena shu savollarni ishlatadi.',
    questionLimit: 120,
    allowHint: true,
  },
  {
    id: 'inglizcha-soz',
    editor: 'word_pair',
    defaultFan: 'ingliz tili',
    defaultMavzu: "inglizcha va o'zbekcha tarjima juftliklari",
    aiDescription: "AI savoli tarjima formatida bo'lsa, u juft so'z ko'rinishida saqlanadi.",
    questionLimit: 120,
    allowHint: true,
  },
  {
    id: 'jumla-ustasi',
    editor: 'word_hint',
    defaultFan: 'ona tili',
    defaultMavzu: "so'z topish va lug'at boyligi",
    aiDescription: "AI savolida to'g'ri variantdagi so'z jumla ustasi uchun word bo'lib olinadi.",
    questionLimit: 120,
    allowHint: true,
  },
  {
    id: 'baraban-metodi',
    editor: 'prompt_only',
    defaultFan: 'umumiy bilim',
    defaultMavzu: "qisqa og'zaki savollar",
    aiDescription: "AI yaratgan savol matnlari baraban uchun prompt sifatida saqlanadi.",
    questionLimit: 200,
  },
]

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

const parseDifficulty = (value: unknown): Difficulty => {
  if (value === 'Oson' || value === "O'rta" || value === 'Qiyin') return value
  return "O'rta"
}

const clampPoints = (value: number) => Math.max(100, Math.min(500, Math.round(value || 200)))

const parseIntegerAnswer = (value: unknown): number | null => {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  if (!/^\d{1,3}$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  return Number.isInteger(parsed) ? parsed : null
}

const getMetaString = (question: BackendQuestion, key: string) =>
  typeof question.metadata_json[key] === 'string' ? String(question.metadata_json[key]) : ''

const getMetaNumber = (question: BackendQuestion, key: string) =>
  typeof question.metadata_json[key] === 'number' ? Number(question.metadata_json[key]) : null

const getMetaStringArray = (question: BackendQuestion, key: string) => {
  const value = question.metadata_json[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

const getCorrectAnswer = (question: BackendQuestion) =>
  question.options[question.correct_index ?? -1]?.trim() || question.answer_text?.trim() || ''

const extractQuotedToken = (prompt: string) => {
  const match = prompt.match(/["'`“”‘’]([^"'`“”‘’]{2,})["'`“”‘’]/)
  return match?.[1]?.trim() ?? null
}

const parseEnglishPairFromAi = (question: string, correctAnswer: string) => {
  const quoted = extractQuotedToken(question)
  const normalizedQuestion = normalizeText(question)
  const normalizedAnswer = normalizeText(correctAnswer)
  if (!quoted || normalizedAnswer.length < 2) return null
  if (normalizedQuestion.includes("o'zbekcha") || normalizedQuestion.includes('uzbekcha')) {
    return { en: normalizeText(quoted), uz: normalizedAnswer }
  }
  if (normalizedQuestion.includes('inglizcha')) {
    return { en: normalizedAnswer, uz: normalizeText(quoted) }
  }
  return null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseSourceDifficulty = (value: unknown): AiQuizDifficulty | null => {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value
  if (value === 'Oson') return 'easy'
  if (value === "O'rta") return 'medium'
  if (value === 'Qiyin') return 'hard'
  return null
}

const parseHeaderValue = (line: string, labels: string[]) => {
  for (const label of labels) {
    const pattern = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'i')
    const match = line.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

const splitDelimitedLine = (line: string, delimiter: string) => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

const parseDelimitedTests = (
  rawText: string,
  delimiter: ',' | '\t',
  config: GameConfig,
  defaults: { fan: string; mavzu: string },
): AiGeneratedPayload | null => {
  const lines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return null

  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => normalizeText(header))
  if (!headers.includes('question')) return null

  const getIndex = (...names: string[]) => headers.findIndex((header) => names.includes(header))
  const questionIndex = getIndex('question', 'savol')
  const correctIndexCell = getIndex('correct', "to'g'ri javob", 'javob', 'correct answer')
  const difficultyIndex = getIndex('difficulty', 'daraja')
  const fanIndex = getIndex('fan')
  const mavzuIndex = getIndex('mavzu', 'topic', 'tema')
  const optionIndices = [
    getIndex('a', 'option_a', 'option a', 'variant_a'),
    getIndex('b', 'option_b', 'option b', 'variant_b'),
    getIndex('c', 'option_c', 'option c', 'variant_c'),
    getIndex('d', 'option_d', 'option d', 'variant_d'),
  ]
  const packedOptionsIndex = getIndex('options', 'variants', 'variantlar')

  if (questionIndex < 0) return null
  if (config.editor !== 'prompt_only' && correctIndexCell < 0) return null

  let detectedFan = defaults.fan
  let detectedMavzu = defaults.mavzu
  const tests: AiGeneratedQuestion[] = []

  lines.slice(1).forEach((line, rowIndex) => {
    const cells = splitDelimitedLine(line, delimiter)
    const question = String(cells[questionIndex] ?? '').trim()
    if (!question) return

    const fanValue = fanIndex >= 0 ? String(cells[fanIndex] ?? '').trim() : ''
    const mavzuValue = mavzuIndex >= 0 ? String(cells[mavzuIndex] ?? '').trim() : ''
    if (fanValue) detectedFan = fanValue
    if (mavzuValue) detectedMavzu = mavzuValue

    const difficulty = parseSourceDifficulty(cells[difficultyIndex] ?? '') ?? 'medium'

    if (config.editor === 'prompt_only') {
      tests.push({
        question,
        options: ['A', 'B', 'C', 'D'] as [string, string, string, string],
        correct: 'A',
        correctIndex: 0,
        difficulty,
      })
      return
    }

    let options: string[] = []
    if (optionIndices.every((index) => index >= 0)) {
      options = optionIndices.map((index) => String(cells[index] ?? '').trim())
    } else if (packedOptionsIndex >= 0) {
      options = String(cells[packedOptionsIndex] ?? '')
        .split(/[|;]/)
        .map((option) => option.trim())
        .filter(Boolean)
    }

    if (options.length !== 4 || options.some((option) => option.length === 0)) {
      throw new Error(`${rowIndex + 2}-qatorda 4 ta variant topilmadi.`)
    }
    if (new Set(options.map(normalizeText)).size !== 4) {
      throw new Error(`${rowIndex + 2}-qatorda variantlar takrorlangan.`)
    }

    const correctToken = String(cells[correctIndexCell] ?? '').trim()
    let correctIndex = -1
    if (/^[ABCD]$/i.test(correctToken)) {
      correctIndex = correctToken.toUpperCase().charCodeAt(0) - 65
    } else {
      correctIndex = options.findIndex((option) => normalizeText(option) === normalizeText(correctToken))
    }
    if (correctIndex < 0 || correctIndex > 3) {
      throw new Error(`${rowIndex + 2}-qatorda to'g'ri javob topilmadi.`)
    }

    tests.push({
      question,
      options: [options[0], options[1], options[2], options[3]] as [string, string, string, string],
      correct: options[correctIndex],
      correctIndex,
      difficulty,
    })
  })

  if (tests.length === 0) return null

  return {
    fan: detectedFan,
    mavzu: detectedMavzu,
    daraja: tests[0]?.difficulty ?? 'medium',
    tests,
  }
}

const parseDocxPayload = async (
  file: File,
  config: GameConfig,
  defaults: { fan: string; mavzu: string },
) => {
  let mammothModule: typeof import('mammoth')
  try {
    mammothModule = await import('mammoth')
  } catch {
    throw new Error(".docx parserni yuklab bo'lmadi.")
  }

  const arrayBuffer = await file.arrayBuffer()
  const result = await mammothModule.extractRawText({ arrayBuffer })
  const rawText = result.value.replace(/\r/g, '').trim()
  if (!rawText) {
    throw new Error(".docx ichidan matn topilmadi.")
  }

  const guessedTsvPayload = parseDelimitedTests(rawText, '\t', config, defaults)
  if (guessedTsvPayload) return guessedTsvPayload

  return parseTextTestBlocks(rawText, config, defaults)
}

const parseSpreadsheetPayload = async (
  file: File,
  config: GameConfig,
  defaults: { fan: string; mavzu: string },
) => {
  let xlsxModule: typeof import('xlsx')
  try {
    xlsxModule = await import('xlsx')
  } catch {
    throw new Error(".xlsx parserni yuklab bo'lmadi.")
  }

  const arrayBuffer = await file.arrayBuffer()
  const workbook = xlsxModule.read(arrayBuffer, { type: 'array' })
  if (!workbook.SheetNames.length) {
    throw new Error('Excel faylda sheet topilmadi.')
  }

  let lastTextFallback = ''

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const csvText = xlsxModule.utils.sheet_to_csv(worksheet).trim()
    if (csvText) {
      const parsedCsv = parseDelimitedTests(csvText, ',', config, defaults)
      if (parsedCsv) return parsedCsv
      lastTextFallback = csvText
    }

    const txtText = xlsxModule.utils.sheet_to_txt(worksheet).trim()
    if (txtText) {
      const parsedTsv = parseDelimitedTests(txtText, '\t', config, defaults)
      if (parsedTsv) return parsedTsv
      lastTextFallback = txtText
    }
  }

  if (lastTextFallback) {
    return parseTextTestBlocks(lastTextFallback, config, defaults)
  }

  throw new Error('Excel fayldan testlarni o‘qib bo‘lmadi.')
}

const parseTextTestBlocks = (
  rawText: string,
  config: GameConfig,
  defaults: { fan: string; mavzu: string },
): AiGeneratedPayload => {
  const normalizedText = rawText.replace(/\r/g, '')
  const lines = normalizedText.split('\n')

  let fan = defaults.fan
  let mavzu = defaults.mavzu
  let fallbackDifficulty: AiQuizDifficulty = 'medium'

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const fanValue = parseHeaderValue(trimmed, ['fan'])
    if (fanValue) {
      fan = fanValue
      continue
    }
    const topicValue = parseHeaderValue(trimmed, ['mavzu', 'tema', 'topic'])
    if (topicValue) {
      mavzu = topicValue
      continue
    }
    const difficultyValue = parseHeaderValue(trimmed, ['daraja', 'difficulty'])
    if (difficultyValue) {
      fallbackDifficulty = parseSourceDifficulty(difficultyValue) ?? fallbackDifficulty
      continue
    }
    if (/^(savol|question)\s*:/i.test(trimmed)) break
  }

  if (config.editor === 'prompt_only') {
    const prompts = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !parseHeaderValue(line, ['fan', 'mavzu', 'tema', 'topic', 'daraja', 'difficulty']))
      .map((line) => line.replace(/^(savol|question)\s*:\s*/i, '').trim())
      .filter((line) => line.length >= 3)

    if (prompts.length === 0) {
      throw new Error("TXT fayldan savollar topilmadi.")
    }

    return {
      fan,
      mavzu,
      daraja: fallbackDifficulty,
      tests: prompts.slice(0, 200).map((prompt) => ({
        question: prompt,
        options: ['A', 'B', 'C', 'D'] as [string, string, string, string],
        correct: 'A',
        correctIndex: 0,
        difficulty: fallbackDifficulty,
      })),
    }
  }

  const blocks = normalizedText
    .split(/\n\s*\n+|\n(?=(?:Savol|Question)\s*:)/i)
    .map((block) => block.trim())
    .filter(Boolean)

  const tests: AiGeneratedQuestion[] = []

  blocks.forEach((block, index) => {
    const blockLines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !parseHeaderValue(line, ['fan', 'mavzu', 'tema', 'topic']))

    if (blockLines.length === 0) return

    let question = ''
    const optionsMap = new Map<number, string>()
    let correctToken = ''
    let difficulty = fallbackDifficulty

    blockLines.forEach((line) => {
      const questionValue = parseHeaderValue(line, ['savol', 'question'])
      if (questionValue) {
        question = questionValue
        return
      }

      const difficultyValue = parseHeaderValue(line, ['daraja', 'difficulty'])
      if (difficultyValue) {
        difficulty = parseSourceDifficulty(difficultyValue) ?? difficulty
        return
      }

      const correctValue = parseHeaderValue(line, ["to'g'ri javob", "togri javob", 'javob', 'correct', 'correct answer'])
      if (correctValue) {
        correctToken = correctValue
        return
      }

      const optionMatch = line.match(/^([ABCD])\s*[\)\.\:\-]\s*(.+)$/i)
      if (optionMatch?.[2]) {
        const optionIndex = optionMatch[1].toUpperCase().charCodeAt(0) - 65
        optionsMap.set(optionIndex, optionMatch[2].trim())
        return
      }

      if (!question) {
        question = line
      }
    })

    if (!question || optionsMap.size === 0) return

    const options = [0, 1, 2, 3].map((optionIndex) => optionsMap.get(optionIndex) ?? '')
    if (options.some((option) => option.length === 0)) {
      throw new Error(`${index + 1}-blokda 4 ta variant to'liq emas.`)
    }
    if (new Set(options.map(normalizeText)).size !== 4) {
      throw new Error(`${index + 1}-blokda variantlar takrorlangan.`)
    }

    let correctIndex = -1
    if (/^[ABCD]$/i.test(correctToken)) {
      correctIndex = correctToken.toUpperCase().charCodeAt(0) - 65
    } else if (correctToken) {
      correctIndex = options.findIndex((option) => normalizeText(option) === normalizeText(correctToken))
    }

    if (correctIndex < 0 || correctIndex > 3) {
      throw new Error(`${index + 1}-blokda to'g'ri javob topilmadi.`)
    }

    tests.push({
      question,
      options: [options[0], options[1], options[2], options[3]] as [string, string, string, string],
      correct: options[correctIndex],
      correctIndex,
      difficulty,
    })
  })

  if (tests.length === 0) {
    throw new Error("TXT fayldan test bloklari topilmadi.")
  }

  return {
    fan,
    mavzu,
    daraja: fallbackDifficulty,
    tests,
  }
}

const parsePreparedFilePayload = async (
  file: File,
  config: GameConfig,
  defaults: { fan: string; mavzu: string },
): Promise<AiGeneratedPayload> => {
  const rawText = (await file.text()).replace(/^\uFEFF/, '').trim()
  if (!rawText) {
    throw new Error("Fayl bo'sh.")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    const extension = file.name.toLowerCase().split('.').pop() ?? ''
    if (extension === 'docx') {
      return parseDocxPayload(file, config, defaults)
    }
    if (extension === 'xlsx' || extension === 'xls') {
      return parseSpreadsheetPayload(file, config, defaults)
    }
    if (extension === 'csv') {
      const csvPayload = parseDelimitedTests(rawText, ',', config, defaults)
      if (csvPayload) return csvPayload
    }
    if (extension === 'tsv') {
      const tsvPayload = parseDelimitedTests(rawText, '\t', config, defaults)
      if (tsvPayload) return tsvPayload
    }
    const guessedCsvPayload = parseDelimitedTests(rawText, ',', config, defaults)
    if (guessedCsvPayload) return guessedCsvPayload
    const guessedTsvPayload = parseDelimitedTests(rawText, '\t', config, defaults)
    if (guessedTsvPayload) return guessedTsvPayload
    return parseTextTestBlocks(rawText, config, defaults)
  }

  const root = isRecord(parsed) ? parsed : null
  const rawTests = Array.isArray(parsed)
    ? parsed
    : root && Array.isArray(root.tests)
      ? root.tests
      : root && Array.isArray(root.questions)
        ? root.questions
        : null

  if (!rawTests || rawTests.length === 0) {
    throw new Error("Faylda testlar ro'yxati topilmadi.")
  }

  const fallbackDifficulty = parseSourceDifficulty(root?.daraja) ?? parseSourceDifficulty(root?.difficulty) ?? 'medium'
  const fan = typeof root?.fan === 'string' && root.fan.trim() ? root.fan.trim() : defaults.fan
  const mavzu = typeof root?.mavzu === 'string' && root.mavzu.trim() ? root.mavzu.trim() : defaults.mavzu

  const tests = rawTests.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${index + 1}-test formati noto'g'ri.`)
    }

    const question = typeof item.question === 'string' ? item.question.trim() : ''
    if (question.length < 3) {
      throw new Error(`${index + 1}-test savol matni yetarli emas.`)
    }

    const difficulty = parseSourceDifficulty(item.difficulty) ?? fallbackDifficulty

    if (config.editor === 'prompt_only') {
      return {
        question,
        options: ['A', 'B', 'C', 'D'] as [string, string, string, string],
        correct: 'A',
        correctIndex: 0,
        difficulty,
      } satisfies AiGeneratedQuestion
    }

    const rawOptions = Array.isArray(item.options) ? item.options : null
    if (!rawOptions || rawOptions.length !== 4) {
      throw new Error(`${index + 1}-testda 4 ta variant bo'lishi kerak.`)
    }

    const options = rawOptions.map((option) => String(option ?? '').trim())
    if (options.some((option) => option.length === 0)) {
      throw new Error(`${index + 1}-testda bo'sh variant bor.`)
    }
    if (new Set(options.map(normalizeText)).size !== 4) {
      throw new Error(`${index + 1}-testda variantlar takrorlangan.`)
    }

    const correctIndexFromFile = typeof item.correctIndex === 'number' ? Number(item.correctIndex) : null
    const correctValue = typeof item.correct === 'string' || typeof item.correct === 'number'
      ? String(item.correct).trim()
      : ''

    let correctIndex = -1
    if (correctIndexFromFile !== null && correctIndexFromFile >= 0 && correctIndexFromFile < 4) {
      correctIndex = correctIndexFromFile
    } else if (correctValue) {
      correctIndex = options.findIndex((option) => normalizeText(option) === normalizeText(correctValue))
    }

    if (correctIndex < 0 || correctIndex > 3) {
      throw new Error(`${index + 1}-testda to'g'ri javob variantlardan biriga mos emas.`)
    }

    return {
      question,
      options: [options[0], options[1], options[2], options[3]] as [string, string, string, string],
      correct: options[correctIndex],
      correctIndex,
      difficulty,
    } satisfies AiGeneratedQuestion
  })

  return {
    fan,
    mavzu,
    daraja: fallbackDifficulty,
    tests,
  }
}

const initialForm = (config: GameConfig): FormState => ({
  difficulty: "O'rta",
  topic: config.topicOptions?.[0]?.value ?? '+',
  prompt: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  hint: '',
  points: 200,
  en: '',
  uz: '',
  word: '',
  answersText: '',
})

const parseAnswerBankEntries = (value: string) => {
  const seen = new Set<string>()
  return value
    .split(/\n|,|;/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length >= 2)
    .filter((item) => {
      const key = normalizeText(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

const buildQuestionKey = (question: BackendQuestion, config: GameConfig): string => {
  if (config.editor === 'prompt_only') return normalizeText(question.prompt)
  if (config.editor === 'answers_bank') {
    const answers = getMetaStringArray(question, 'correctAnswers')
    return normalizeText(`${question.prompt}__${answers.join('|')}__${getMetaString(question, 'difficulty') || question.difficulty || ''}`)
  }
  if (config.editor === 'word_pair') {
    const en = getMetaString(question, 'en') || question.prompt
    const uz = getMetaString(question, 'uz') || getCorrectAnswer(question)
    return normalizeText(`${en}__${uz}`)
  }
  if (config.editor === 'word_hint') {
    const word = getMetaString(question, 'word') || getCorrectAnswer(question) || question.prompt
    return normalizeText(word)
  }

  const promptKey = normalizeText(question.prompt)
  const difficulty = parseDifficulty(getMetaString(question, 'difficulty') || question.difficulty)
  if (config.id === 'box-jang') return normalizeText(`${question.prompt}__${getCorrectAnswer(question)}`)
  if (config.id === 'car-racing-math' || config.id === 'tezkor-hisob') {
    return `${difficulty}__${getMetaString(question, 'topic') || '+'}__${promptKey}`
  }
  if (config.id === 'arqon-tortish') {
    return normalizeText(`${question.prompt}__${getCorrectAnswer(question)}__${difficulty}__${getMetaString(question, 'topic') || '+'}`)
  }
  if (config.id === 'quiz-battle') {
    return normalizeText(`${question.prompt}__${question.options.join('|')}__${question.correct_index ?? -1}__${clampPoints(getMetaNumber(question, 'points') ?? 200)}`)
  }
  if (config.id === 'topqirlik-kvest') {
    return normalizeText(`${question.prompt}__${question.options.join('|')}__${question.correct_index ?? -1}`)
  }
  return `${difficulty}__${promptKey}`
}

const buildBaseMeta = (config: GameConfig, difficulty: Difficulty, form: FormState) => {
  const meta: Record<string, unknown> = {
    source: config.id,
    difficulty,
  }
  if (config.topicOptions?.length) meta.topic = form.topic
  if (config.allowPoints) meta.points = clampPoints(form.points)
  if (config.allowHint) meta.hint = form.hint.trim()
  return meta
}

const describeQuestion = (question: BackendQuestion, config: GameConfig) => {
  if (config.editor === 'prompt_only') {
    return { title: question.prompt.trim(), subtitle: 'Prompt savol' }
  }
  if (config.editor === 'answers_bank') {
    const answers = getMetaStringArray(question, 'correctAnswers')
    const difficulty = parseDifficulty(getMetaString(question, 'difficulty') || question.difficulty)
    const sample = answers.slice(0, 5).join(', ')
    return {
      title: question.prompt.trim(),
      subtitle: `Daraja: ${difficulty} | Javoblar: ${answers.length} ta | Namuna: ${sample}${answers.length > 5 ? '...' : ''}`,
    }
  }
  if (config.editor === 'word_pair') {
    const en = getMetaString(question, 'en') || question.prompt
    const uz = getMetaString(question, 'uz') || getCorrectAnswer(question)
    const hint = getMetaString(question, 'hint') || question.hint || ''
    return { title: `${en} -> ${uz}`, subtitle: hint ? `Hint: ${hint}` : 'Tarjima juftligi' }
  }
  if (config.editor === 'word_hint') {
    const word = getMetaString(question, 'word') || getCorrectAnswer(question) || question.prompt
    const hint = getMetaString(question, 'hint') || question.hint || ''
    return { title: word, subtitle: hint ? `Hint: ${hint}` : 'Soz topish savoli' }
  }

  const correctAnswer = getCorrectAnswer(question)
  const difficulty = parseDifficulty(getMetaString(question, 'difficulty') || question.difficulty)
  const parts = [`Daraja: ${difficulty}`]
  if (config.topicOptions?.length) parts.push(`Amal: ${getMetaString(question, 'topic') || '+'}`)
  if (config.allowPoints) parts.push(`Ball: ${clampPoints(getMetaNumber(question, 'points') ?? 200)}`)
  if (correctAnswer) parts.push(`Javob: ${correctAnswer}`)
  return {
    title: question.prompt.trim(),
    subtitle: parts.join(' | '),
  }
}

function QuestionManagerPage() {
  const canUseTeacherContent = useTeacherGameAccess()
  const [selectedGameId, setSelectedGameId] = useState<GameId>('millioner')
  const [questions, setQuestions] = useState<BackendQuestion[]>([])
  const [form, setForm] = useState<FormState>(() => initialForm(GAME_CONFIGS[0]))
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFileImporting, setIsFileImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('')
  const [lastImportedOutput, setLastImportedOutput] = useState<AiGeneratedPayload | null>(null)

  const activeConfig = useMemo(
    () => GAME_CONFIGS.find((item) => item.id === selectedGameId) ?? GAME_CONFIGS[0],
    [selectedGameId],
  )
  const activeGame = findGameById(activeConfig.id)
  const toneClass = activeGame?.tone ?? 'from-cyan-500 to-blue-600'

  const existingKeys = useMemo(
    () => new Set(questions.map((question) => buildQuestionKey(question, activeConfig))),
    [activeConfig, questions],
  )

  const refreshQuestions = async (gameId: GameId) => {
    if (!canUseTeacherContent) {
      setQuestions([])
      return
    }
    setIsLoading(true)
    try {
      setQuestions(await fetchGameQuestions(gameId))
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Savollarni yuklab bo'lmadi.")
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setForm(initialForm(activeConfig))
    setStatusText('')
    setLastImportedOutput(null)
  }, [activeConfig])

  useEffect(() => {
    void refreshQuestions(activeConfig.id)
  }, [activeConfig.id, canUseTeacherContent])

  const updateOption = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.options] as [string, string, string, string]
      next[index] = value
      return { ...prev, options: next }
    })
  }

  const createPayloadFromForm = (): { key: string; payload: CreateBackendQuestionPayload } => {
    const difficulty = parseDifficulty(form.difficulty)

    if (activeConfig.editor === 'prompt_only') {
      const prompt = form.prompt.trim()
      if (prompt.length < 3) throw new Error("Savol matni kamida 3 ta belgidan iborat bo'lsin.")
      return {
        key: normalizeText(prompt),
        payload: {
          gameId: activeConfig.id,
          questionType: 'open_text',
          prompt,
          metadata: { source: activeConfig.id },
        },
      }
    }

    if (activeConfig.editor === 'answers_bank') {
      const prompt = form.prompt.trim()
      const hint = form.hint.trim()
      const answers = parseAnswerBankEntries(form.answersText)
      if (prompt.length < 6) throw new Error("Savol matni kamida 6 ta belgidan iborat bo'lsin.")
      if (answers.length < 8) throw new Error('Kamida 8 ta noyob to`g`ri javob kiriting.')
      return {
        key: normalizeText(`${prompt}__${answers.join('|')}__${difficulty}`),
        payload: {
          gameId: activeConfig.id,
          questionType: 'open_text',
          prompt,
          answerText: answers[0],
          hint: hint || null,
          difficulty,
          metadata: {
            source: activeConfig.id,
            difficulty,
            hint,
            category: 'any',
            answerGoal: Math.max(6, Math.min(answers.length, answers.length - 1)),
            correctAnswers: answers,
          },
        },
      }
    }

    if (activeConfig.editor === 'word_pair') {
      const en = form.en.trim().toLowerCase()
      const uz = form.uz.trim().toLowerCase()
      const hint = form.hint.trim()
      if (en.length < 2 || uz.length < 2) throw new Error("Inglizcha va o'zbekcha juftlikni to'liq kiriting.")
      return {
        key: normalizeText(`${en}__${uz}`),
        payload: {
          gameId: activeConfig.id,
          questionType: 'open_text',
          prompt: en,
          answerText: uz,
          hint: hint || null,
          difficulty,
          metadata: { source: activeConfig.id, difficulty, en, uz, hint },
        },
      }
    }

    if (activeConfig.editor === 'word_hint') {
      const word = form.word.trim()
      const hint = form.hint.trim()
      if (word.length < 3) throw new Error("To'g'ri so'z kamida 3 harf bo'lsin.")
      return {
        key: normalizeText(word),
        payload: {
          gameId: activeConfig.id,
          questionType: 'open_text',
          prompt: hint || word,
          answerText: word,
          hint: hint || null,
          difficulty,
          metadata: { source: activeConfig.id, difficulty, word, hint },
        },
      }
    }

    const prompt = form.prompt.trim()
    const options = form.options.map((item) => item.trim()) as [string, string, string, string]
    if (prompt.length < 3) throw new Error("Savol matni kamida 3 ta belgidan iborat bo'lsin.")
    if (options.some((item) => item.length < 1)) throw new Error("4 ta variantning hammasini to'ldiring.")
    if (new Set(options.map(normalizeText)).size !== 4) throw new Error('Variantlar takrorlanmasin.')
    if (activeConfig.id === 'arqon-tortish' && parseIntegerAnswer(options[form.correctIndex]) === null) {
      throw new Error("Arqon tortish uchun to'g'ri javob 0-999 oralig'idagi butun son bo'lishi kerak.")
    }

    const metadata = buildBaseMeta(activeConfig, difficulty, form)
    const payload: CreateBackendQuestionPayload = {
      gameId: activeConfig.id,
      questionType: 'multiple_choice',
      prompt,
      options,
      correctIndex: form.correctIndex,
      difficulty,
      hint: activeConfig.allowHint ? form.hint.trim() || null : null,
      metadata,
    }

    return {
      key: buildQuestionKey({
        id: '',
        teacher_id: '',
        game_id: activeConfig.id,
        question_type: 'multiple_choice',
        prompt,
        options,
        correct_index: form.correctIndex,
        answer_text: null,
        hint: payload.hint ?? null,
        difficulty,
        metadata_json: metadata,
        is_archived: false,
        created_at: '',
        updated_at: '',
      }, activeConfig),
      payload,
    }
  }

  const handleManualSave = async () => {
    if (!canUseTeacherContent) {
      setStatusText("Teacher akkaunti bilan kiring.")
      return
    }

    let prepared: { key: string; payload: CreateBackendQuestionPayload }
    try {
      prepared = createPayloadFromForm()
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Savolni tayyorlab bo'lmadi.")
      return
    }

    if (existingKeys.has(prepared.key)) {
      setStatusText("Bu savol allaqachon mavjud.")
      return
    }

    setIsSaving(true)
    try {
      await createGameQuestion(prepared.payload)
      await refreshQuestions(activeConfig.id)
      setForm(initialForm(activeConfig))
      setStatusText("Savol saqlandi.")
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Savol backendga saqlanmadi.")
    } finally {
      setIsSaving(false)
    }
  }

  const importGeneratedPayload = async (generated: AiGeneratedPayload, sourceLabel: string) => {
    if (!canUseTeacherContent) {
      const message = "Teacher akkaunti bilan kiring."
      setStatusText(message)
      return message
    }

    if (activeConfig.editor === 'answers_bank') {
      const message = 'Ko`p javobli battle savollar uchun qo`lda teacher bank to`ldiriladi.'
      setStatusText(message)
      return message
    }

    setLastImportedOutput(generated)
    const batchKeys = new Set(existingKeys)
    let imported = 0
    let skipped = 0
    let failed = 0

    for (const test of generated.tests) {
      let key = ''
      let payload: CreateBackendQuestionPayload | null = null

      if (activeConfig.editor === 'prompt_only') {
        const prompt = test.question.trim()
        key = normalizeText(prompt)
        payload = { gameId: activeConfig.id, questionType: 'open_text', prompt, metadata: { source: activeConfig.id } }
      } else if (activeConfig.editor === 'word_pair') {
        const pair = parseEnglishPairFromAi(test.question, test.options[test.correctIndex] ?? '')
        if (!pair) {
          skipped += 1
          continue
        }
        const testDifficulty = mapAiDifficultyToUzbek(test.difficulty || generated.daraja)
        key = normalizeText(`${pair.en}__${pair.uz}`)
        payload = {
          gameId: activeConfig.id,
          questionType: 'open_text',
          prompt: pair.en,
          answerText: pair.uz,
          hint: null,
          difficulty: testDifficulty,
          metadata: {
            source: activeConfig.id,
            difficulty: testDifficulty,
            en: pair.en,
            uz: pair.uz,
            ai_fan: generated.fan,
            ai_mavzu: generated.mavzu,
          },
        }
      } else if (activeConfig.editor === 'word_hint') {
        const word = (test.options[test.correctIndex] ?? '').trim()
        if (word.length < 3) {
          skipped += 1
          continue
        }
        const testDifficulty = mapAiDifficultyToUzbek(test.difficulty || generated.daraja)
        key = normalizeText(word)
        payload = {
          gameId: activeConfig.id,
          questionType: 'open_text',
          prompt: test.question,
          answerText: word,
          hint: test.question,
          difficulty: testDifficulty,
          metadata: {
            source: activeConfig.id,
            difficulty: testDifficulty,
            word,
            hint: test.question,
            ai_fan: generated.fan,
            ai_mavzu: generated.mavzu,
          },
        }
      } else {
        const correctAnswer = test.options[test.correctIndex] ?? ''
        if (activeConfig.id === 'arqon-tortish' && parseIntegerAnswer(correctAnswer) === null) {
          skipped += 1
          continue
        }
        const testDifficulty = mapAiDifficultyToUzbek(test.difficulty || generated.daraja)
        const metadata = {
          ...buildBaseMeta(activeConfig, testDifficulty, form),
          ai_fan: generated.fan,
          ai_mavzu: generated.mavzu,
        }
        payload = {
          gameId: activeConfig.id,
          questionType: 'multiple_choice',
          prompt: test.question,
          options: test.options,
          correctIndex: test.correctIndex,
          difficulty: testDifficulty,
          hint: activeConfig.allowHint ? form.hint.trim() || null : null,
          metadata,
        }
        key = buildQuestionKey({
          id: '',
          teacher_id: '',
          game_id: activeConfig.id,
          question_type: 'multiple_choice',
          prompt: test.question,
          options: [...test.options],
          correct_index: test.correctIndex,
          answer_text: null,
          hint: payload.hint ?? null,
          difficulty: testDifficulty,
          metadata_json: metadata,
          is_archived: false,
          created_at: '',
          updated_at: '',
        }, activeConfig)
      }

      if (!payload || batchKeys.has(key)) {
        skipped += 1
        continue
      }

      batchKeys.add(key)

      try {
        await createGameQuestion(payload)
        imported += 1
      } catch {
        failed += 1
      }
    }

    await refreshQuestions(activeConfig.id)
    const parts: string[] = []
    if (imported > 0) {
      parts.push(sourceLabel === 'AI' ? `${imported} ta AI savol qo'shildi.` : `${imported} ta savol fayldan qo'shildi.`)
    }
    if (skipped > 0) parts.push(`${skipped} tasi formatga mos kelmagani yoki takror bo'lgani uchun o'tkazildi.`)
    if (failed > 0) parts.push(`${failed} tasi backendga saqlanmadi.`)
    const message = parts.join(' ') || (sourceLabel === 'AI' ? "Yangi AI savol qo'shilmadi." : "Fayldan yangi savol qo'shilmadi.")
    setStatusText(message)
    return message
  }

  const handleAiImport = async (generated: AiGeneratedPayload) => importGeneratedPayload(generated, 'AI')

  const handleFileImport = async (file: File) => {
    if (!canUseTeacherContent) {
      setStatusText("Teacher akkaunti bilan kiring.")
      return
    }

    setIsFileImporting(true)
    setStatusText("Fayl o'qilmoqda...")
    try {
      const generated = await parsePreparedFilePayload(file, activeConfig, {
        fan: activeConfig.defaultFan,
        mavzu: activeConfig.defaultMavzu,
      })
      const message = await importGeneratedPayload(generated, 'fayl')
      setStatusText(message)
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Fayldagi testlarni o'qib bo'lmadi.")
    } finally {
      setIsFileImporting(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!window.confirm("Haqiqatan ham savolni o'chirmoqchimisiz?")) return
    setDeletingId(questionId)
    try {
      await deleteGameQuestion(questionId)
      await refreshQuestions(activeConfig.id)
      setStatusText("Savol o'chirildi.")
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Savolni o'chirib bo'lmadi.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#eef7ff_0%,#f8fbff_48%,#fff4df_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_88%_18%,rgba(249,115,22,0.12),transparent_24%),radial-gradient(circle_at_26%_82%,rgba(250,204,21,0.16),transparent_22%)]" />
      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-10 sm:px-6">
          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur-xl" data-aos="fade-up">
            <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-cyan-700">
              Test tizimi
            </p>
            <h1 className="mt-3 font-kid text-5xl text-slate-900 sm:text-6xl">Teacher savollar markazi</h1>
            <p className="mt-3 max-w-4xl text-lg font-bold leading-relaxed text-slate-600">
              Endi teacher savollar shu sahifada boshqariladi. O'yin setup sahifalaridan qo'shish olib tashlanadi,
              arena esa shu yerda saqlangan backend savollaridan foydalanadi.
            </p>
          </section>

          {!canUseTeacherContent ? (
            <section className="mt-6" data-aos="fade-up" data-aos-delay="60">
              <TeacherFeatureNotice />
            </section>
          ) : (
            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]" data-aos="fade-up" data-aos-delay="60">
              <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
                <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Savol qo'shish</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {GAME_CONFIGS.map((config) => {
                    const game = findGameById(config.id)
                    const active = config.id === activeConfig.id
                    return (
                      <button
                        key={config.id}
                        type="button"
                        onClick={() => setSelectedGameId(config.id)}
                        className={`rounded-3xl border px-4 py-4 text-left transition ${
                          active
                            ? `border-transparent bg-gradient-to-r text-white shadow-soft ${game?.tone ?? toneClass}`
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-cyan-300'
                        }`}
                      >
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] opacity-70">{config.editor.replace('_', ' ')}</p>
                        <p className="mt-2 text-lg font-extrabold">{game?.title ?? config.id}</p>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Tanlangan o'yin</p>
                      <p className="mt-1 text-2xl font-kid text-slate-900">{activeGame?.title ?? activeConfig.id}</p>
                    </div>
                    <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600">
                      {questions.length}/{activeConfig.questionLimit} ta savol
                    </p>
                  </div>

                  {activeConfig.editor !== 'answers_bank' ? (
                    <>
                      <div className="mt-4">
                        <AiQuizImportPanel
                          toneClass={toneClass}
                          defaultFan={activeConfig.defaultFan}
                          defaultMavzu={activeConfig.defaultMavzu}
                          description={activeConfig.aiDescription}
                          generatorRules={activeConfig.generatorRules}
                          onImport={handleAiImport}
                        />
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Tayyor fayl yuklash</p>
                            <p className="mt-1 text-lg font-extrabold text-slate-800">Teacher testlarini fayldan qo'shish</p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                            .json / .txt / .csv / .tsv / .md / .docx / .xlsx
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                          JSON, TXT, CSV, TSV, MD, DOCX va XLSX fayllarni qabul qiladi.
                          <span className="font-extrabold text-slate-700"> question, options, correct, difficulty</span> maydonlari ishlaydi.
                        </p>

                        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <label className="flex min-w-0 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-sm font-extrabold text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50">
                            <input
                              type="file"
                              accept=".json,.txt,.text,.md,.csv,.tsv,.docx,.xlsx,.xls,text/plain,text/markdown,text/csv,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                event.target.value = ''
                                if (file) {
                                  void handleFileImport(file)
                                }
                              }}
                            />
                            {isFileImporting ? 'Fayl import qilinyapti...' : 'Fayl tanlash'}
                          </label>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                            <p>Masalan JSON:</p>
                            <p className="mt-1 font-mono text-xs text-slate-600">[{`{"question":"Savol","options":["A","B","C","D"],"correct":"A","difficulty":"easy"}`}]</p>
                            <p className="mt-3">Masalan TXT:</p>
                            <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-600">{`Savol: 8 + 5 = ?\nA: 12\nB: 13\nC: 14\nD: 15\nJavob: B\nDaraja: easy`}</pre>
                            <p className="mt-3">Masalan CSV:</p>
                            <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-600">{`question,A,B,C,D,correct,difficulty\n8 + 5 = ?,12,13,14,15,B,easy`}</pre>
                            <p className="mt-3 text-xs">DOCX va XLSX ichida ham shu maydonlar satrlar yoki jadval ko'rinishida bo'lsa o'qiladi.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Battle answer bank</p>
                      <p className="mt-2 text-lg font-extrabold text-slate-800">Ko`p javobli teacher savollar</p>
                      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                        Bu o`yin uchun teacher prompt va ko`p to`g`ri javob qo`lda kiritiladi. Arena metadata ichidagi
                        <span className="font-extrabold text-slate-700"> correctAnswers[] </span>
                        ro`yxatini ishlatadi.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid gap-3">
                    {activeConfig.editor === 'prompt_only' ? (
                      <textarea
                        value={form.prompt}
                        onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
                        rows={3}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                        placeholder="Savol matni"
                      />
                    ) : null}

                    {activeConfig.editor === 'word_pair' ? (
                      <>
                        <input
                          value={form.en}
                          onChange={(event) => setForm((prev) => ({ ...prev, en: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="Inglizcha so'z yoki ibora"
                        />
                        <input
                          value={form.uz}
                          onChange={(event) => setForm((prev) => ({ ...prev, uz: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="O'zbekcha tarjima"
                        />
                        <input
                          value={form.hint}
                          onChange={(event) => setForm((prev) => ({ ...prev, hint: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="Hint (ixtiyoriy)"
                        />
                      </>
                    ) : null}

                    {activeConfig.editor === 'word_hint' ? (
                      <>
                        <input
                          value={form.word}
                          onChange={(event) => setForm((prev) => ({ ...prev, word: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="To'g'ri so'z"
                        />
                        <input
                          value={form.hint}
                          onChange={(event) => setForm((prev) => ({ ...prev, hint: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="Hint yoki savol matni"
                        />
                      </>
                    ) : null}

                    {activeConfig.editor === 'answers_bank' ? (
                      <>
                        <select
                          value={form.difficulty}
                          onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value as Difficulty }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                        >
                          <option value="Oson">Oson</option>
                          <option value="O'rta">O'rta</option>
                          <option value="Qiyin">Qiyin</option>
                        </select>
                        <textarea
                          value={form.prompt}
                          onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
                          rows={3}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="Ko`p javobli savol matni"
                        />
                        <input
                          value={form.hint}
                          onChange={(event) => setForm((prev) => ({ ...prev, hint: event.target.value }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="Hint (ixtiyoriy)"
                        />
                        <textarea
                          value={form.answersText}
                          onChange={(event) => setForm((prev) => ({ ...prev, answersText: event.target.value }))}
                          rows={8}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder={'Har bir javobni yangi qatordan yozing\nSamarqand\nBuxoro\nXiva\nToshkent'}
                        />
                        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                          Hozirgi ro`yxat: <span className="font-extrabold text-slate-800">{parseAnswerBankEntries(form.answersText).length}</span> ta noyob javob.
                        </p>
                      </>
                    ) : null}

                    {activeConfig.editor === 'multiple_choice' ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={form.difficulty}
                            onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value as Difficulty }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          >
                            <option value="Oson">Oson</option>
                            <option value="O'rta">O'rta</option>
                            <option value="Qiyin">Qiyin</option>
                          </select>
                          {activeConfig.topicOptions?.length ? (
                            <select
                              value={form.topic}
                              onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value as TopicValue }))}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                            >
                              {activeConfig.topicOptions.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                        <textarea
                          value={form.prompt}
                          onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
                          rows={3}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                          placeholder="Savol matni"
                        />
                        {activeConfig.allowHint ? (
                          <input
                            value={form.hint}
                            onChange={(event) => setForm((prev) => ({ ...prev, hint: event.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                            placeholder="Hint (ixtiyoriy)"
                          />
                        ) : null}
                        {activeConfig.allowPoints ? (
                          <input
                            type="number"
                            min={100}
                            max={500}
                            value={form.points}
                            onChange={(event) => setForm((prev) => ({ ...prev, points: Number(event.target.value) || 200 }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                            placeholder="Ball"
                          />
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {form.options.map((option, index) => (
                            <input
                              key={`option-${index}`}
                              value={option}
                              onChange={(event) => updateOption(index, event.target.value)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                              placeholder={`${String.fromCharCode(65 + index)} variant`}
                            />
                          ))}
                        </div>
                        <select
                          value={form.correctIndex}
                          onChange={(event) => setForm((prev) => ({ ...prev, correctIndex: Number(event.target.value) }))}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
                        >
                          <option value={0}>To'g'ri javob: A</option>
                          <option value={1}>To'g'ri javob: B</option>
                          <option value={2}>To'g'ri javob: C</option>
                          <option value={3}>To'g'ri javob: D</option>
                        </select>
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => { void handleManualSave() }}
                      disabled={isSaving}
                      className={`rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${toneClass}`}
                    >
                      {isSaving ? 'Saqlanmoqda...' : "Savolni saqlash"}
                    </button>
                  </div>
                </div>

                {statusText ? (
                  <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-600">
                    {statusText}
                  </p>
                ) : null}

                {lastImportedOutput ? (
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">JSON preview</p>
                    <textarea
                      readOnly
                      value={JSON.stringify(lastImportedOutput, null, 2)}
                      className="mt-3 h-48 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                ) : null}
              </article>

              <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-kid text-4xl text-slate-900 sm:text-5xl">Saqlangan savollar</h2>
                    <p className="mt-2 text-sm font-bold text-slate-500">{activeGame?.title ?? activeConfig.id}</p>
                  </div>
                  <p className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-600">
                    {questions.length} ta
                  </p>
                </div>

                <div className="mt-5 max-h-[900px] space-y-3 overflow-auto pr-1">
                  {isLoading ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-extrabold text-slate-500">
                      Savollar yuklanmoqda...
                    </p>
                  ) : questions.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-bold text-slate-500">
                      Hozircha teacher savol yo'q.
                    </p>
                  ) : (
                    questions.map((question, index) => {
                      const summary = describeQuestion(question, activeConfig)
                      return (
                        <div key={question.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-slate-900">
                                {index + 1}. {summary.title}
                              </p>
                              <p className="mt-2 text-xs font-bold text-slate-500">{summary.subtitle}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { void handleDelete(question.id) }}
                              disabled={deletingId === question.id}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === question.id ? "O'chirilmoqda..." : "O'chir"}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </article>
            </section>
          )}
        </main>
        <FooterCTA />
      </div>
    </div>
  )
}

export default QuestionManagerPage
