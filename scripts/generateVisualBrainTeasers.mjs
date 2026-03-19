import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const RAW_BASE = 'https://raw.githubusercontent.com/declare-lab/LLM-PuzzleTest/master/PuzzleVQA/data'
const OUTPUT_PATH = path.join(projectRoot, 'src', 'data', 'visualBrainTeasers.json')

const VALUE_TRANSLATIONS = {
  red: 'qizil',
  blue: "ko'k",
  green: 'yashil',
  yellow: 'sariq',
  orange: "to'q sariq",
  purple: 'binafsha',
  'light purple': 'och binafsha',
  'medium purple': "o'rta binafsha",
  'dark purple': "to'q binafsha",
  'very dark purple': "juda to'q binafsha",
  'light blue': "och ko'k",
  'dark green': "to'q yashil",
  small: 'kichik',
  medium: "o'rta",
  large: 'katta',
  'extra large': 'juda katta',
  triangle: 'uchburchak',
  square: 'kvadrat',
  pentagon: 'beshburchak',
  hexagon: "olti burchak",
}

const EXTRA_OPTIONS = {
  color: ['oq', 'qora', 'pushti', 'kulrang'],
  number: ['0', '2', '4', '6', '8'],
  shape: ['doira', 'romb', 'yulduz', 'trapetsiya'],
  size: ['juda kichik', 'juda katta', 'ulkan', 'mini'],
}

const SOURCES = [
  {
    key: 'color_grid',
    count: 10,
    difficulty: 'easy',
    category: 'pattern logic',
    answerType: 'color',
    question_uz: 'Rasmda savol belgisi turgan joyga qaysi rang mos keladi?',
    explanation: (answer) =>
      `Doiralardagi ranglar joylashuv bo'yicha takrorlanmoqda. Burchak va markaz yonidagi bo'laklar o'z naqshini saqlagan, shuning uchun javob ${answer}.`,
  },
  {
    key: 'color_hexagon',
    count: 10,
    difficulty: 'easy',
    category: 'pattern logic',
    answerType: 'color',
    question_uz: 'Olti burchakdagi savol belgisi o\'rniga qaysi rang tushadi?',
    explanation: (answer) =>
      `Qarama-qarshi bo'laklar bir xil rang bilan juftlangan. Shu naqsh bo'yicha bo'sh joyga ${answer} keladi.`,
  },
  {
    key: 'color_size_circle',
    count: 10,
    difficulty: 'easy',
    category: 'pattern logic',
    answerType: 'color',
    question_uz: 'Rasmda o\'lcham va rang orasidagi bog\'lanishga qarab qaysi rang yetishmayapti?',
    explanation: (answer) =>
      `Aylana kattalashgan sari rang to'qroq, kichraygan sari esa ochroq bo'lib boryapti. Shu qoidaga ko'ra javob ${answer}.`,
  },
  {
    key: 'size_cycle',
    count: 10,
    difficulty: 'easy',
    category: 'visual IQ puzzles',
    answerType: 'size',
    question_uz: 'Spiral ketma-ketlikdagi savol belgisi o\'rnida qaysi o\'lcham bo\'lishi kerak?',
    explanation: (answer) =>
      `Har bir spiral yo'lda aylana o'lchamlari kichik, o'rta va katta tarzida ketmoqda. Demak, bo'sh joyga ${answer} mos keladi.`,
  },
  {
    key: 'grid_number',
    count: 10,
    difficulty: 'medium',
    category: 'missing number',
    answerType: 'number',
    question_uz: 'Raqamlar jadvalidagi savol belgisi o\'rniga qaysi son to\'g\'ri keladi?',
    explanation: (answer) =>
      `Har bir qatordagi sonlar bir xil yig'indi berayotganini ko'rish mumkin. Shu qoida bilan noma'lum son ${answer} bo'ladi.`,
  },
  {
    key: 'shape_reflect',
    count: 10,
    difficulty: 'medium',
    category: 'visual IQ puzzles',
    answerType: 'shape',
    question_uz: 'Aks ettirish qoidasiga ko\'ra savol belgisi o\'rniga qaysi shakl tushadi?',
    explanation: (answer) =>
      `Pastki qism tepada turgan shakllarning aksini takrorlaydi. Shu sabab bo'sh joyga ${answer} kerak.`,
  },
  {
    key: 'shape_morph',
    count: 10,
    difficulty: 'medium',
    category: 'pattern logic',
    answerType: 'shape',
    question_uz: 'Shakllarning o\'zgarish ketma-ketligiga qarab qaysi shakl yetishmayapti?',
    explanation: (answer) =>
      `Shakllar bosqichma-bosqich boshqa ko'rinishga o'tib boryapti. Oxirgi bo'sh joyni shu o'tishning davomi bo'lgan ${answer} to'ldiradi.`,
  },
  {
    key: 'triangle',
    count: 10,
    difficulty: 'medium',
    category: 'math visual puzzles',
    answerType: 'number',
    question_uz: 'Uchburchakli sonlar boshqotirmasida savol belgisi o\'rniga qaysi son mos keladi?',
    explanation: (answer) =>
      `Har uchlikda oxirgi son qolgan ikki sonning ko'paytmasi bo'lib chiqyapti. Shuning uchun to'g'ri javob ${answer}.`,
  },
  {
    key: 'color_overlap_squares',
    count: 10,
    difficulty: 'hard',
    category: 'visual IQ puzzles',
    answerType: 'color',
    question_uz: 'Ustma-ust tushgan kvadratlar rangiga qarab savol belgisi o\'rniga qaysi rang keladi?',
    explanation: (answer) =>
      `Kvadratlar kesishgan joyda ranglar aralashib yangi rang hosil qilmoqda. Berilgan aralash ranglarga qarab noma'lum rang ${answer} bo'ladi.`,
  },
  {
    key: 'venn',
    count: 10,
    difficulty: 'hard',
    category: 'math visual puzzles',
    answerType: 'number',
    question_uz: 'Venn doiralari orasidagi bog\'lanishga qarab savol belgisi o\'rniga qaysi son tushadi?',
    explanation: (answer) =>
      `Kesishgan qismlardagi sonlar doiralardagi sonlarning yig'indisini ko'rsatmoqda. Shu qoidaga ko'ra noma'lum son ${answer}.`,
  },
]

const translateValue = (value) => {
  if (typeof value === 'number') return String(value)

  const text = String(value).trim()
  const normalized = text.toLowerCase()
  return VALUE_TRANSLATIONS[normalized] ?? text
}

const uniq = (items) => Array.from(new Set(items))

const normalizeOptions = (options, answer, answerType) => {
  const translated = uniq(options.map((option) => translateValue(option)))
  const next = translated.includes(answer) ? [...translated] : [...translated, answer]

  for (const extra of EXTRA_OPTIONS[answerType]) {
    if (next.length >= 4) break
    if (!next.includes(extra)) {
      next.push(extra)
    }
  }

  if (next.length > 4) {
    const trimmed = next.filter((option) => option !== answer).slice(0, 3)
    return uniq([...trimmed, answer])
  }

  return next
}

const loadJsonLines = async (fileKey) => {
  const response = await fetch(`${RAW_BASE}/${fileKey}.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileKey}.json: ${response.status}`)
  }

  const text = await response.text()
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

const buildItems = async () => {
  const items = []
  let globalIndex = 1

  for (const source of SOURCES) {
    const records = await loadJsonLines(source.key)

    for (const record of records.slice(0, source.count)) {
      const translatedAnswer = translateValue(record.answer)
      const options = normalizeOptions(record.options ?? [], translatedAnswer, source.answerType)

      items.push({
        id: `visual-brainteaser-${String(globalIndex).padStart(3, '0')}`,
        question_uz: source.question_uz,
        image_url: `${RAW_BASE}/${record.image}`,
        options,
        correct_answer: translatedAnswer,
        difficulty: source.difficulty,
        category: source.category,
        explanation_uz: source.explanation(translatedAnswer),
      })

      globalIndex += 1
    }
  }

  return items
}

const validateDataset = (items) => {
  if (items.length !== 100) {
    throw new Error(`Expected 100 items, received ${items.length}`)
  }

  const difficultyCount = items.reduce(
    (accumulator, item) => ({
      ...accumulator,
      [item.difficulty]: (accumulator[item.difficulty] ?? 0) + 1,
    }),
    {},
  )

  if (difficultyCount.easy !== 40 || difficultyCount.medium !== 40 || difficultyCount.hard !== 20) {
    throw new Error(`Unexpected difficulty split: ${JSON.stringify(difficultyCount)}`)
  }

  for (const item of items) {
    if (!item.image_url.startsWith('https://')) {
      throw new Error(`Invalid image URL for ${item.id}`)
    }

    if (!item.options.includes(item.correct_answer)) {
      throw new Error(`Correct answer missing in options for ${item.id}`)
    }

    if (item.options.length < 3 || item.options.length > 4) {
      throw new Error(`Unexpected option count for ${item.id}`)
    }
  }
}

const dataset = await buildItems()
validateDataset(dataset)

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')

console.log(`Generated ${dataset.length} records at ${OUTPUT_PATH}`)
