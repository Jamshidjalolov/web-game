import { useState } from 'react'
import {
  CURRICULUM_GRADES,
  getSubjectsForGrade,
  type CurriculumGradeId,
} from '../data/curriculumCatalog.ts'
import {
  generateAiCurriculumTopics,
  generateAiQuizBatch,
  type AiCurriculumTopicsPayload,
  type AiGeneratedPayload,
  type AiQuizDifficulty,
  type AiQuizGenerationRules,
} from '../lib/aiQuizGenerator.ts'

type AiQuizImportPanelProps = {
  toneClass: string
  defaultFan: string
  defaultMavzu: string
  description: string
  onImport: (payload: AiGeneratedPayload) => Promise<string>
  generatorRules?: AiQuizGenerationRules
}

function AiQuizImportPanel({
  toneClass,
  defaultFan,
  defaultMavzu,
  description,
  onImport,
  generatorRules,
}: AiQuizImportPanelProps) {
  const [selectedGrade, setSelectedGrade] = useState<CurriculumGradeId | ''>('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [fan, setFan] = useState(defaultFan)
  const [mavzu, setMavzu] = useState(defaultMavzu)
  const [daraja, setDaraja] = useState<AiQuizDifficulty>('medium')
  const [savollarSoni, setSavollarSoni] = useState(3)
  const [isBusy, setIsBusy] = useState(false)
  const [isTopicsBusy, setIsTopicsBusy] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [topicsText, setTopicsText] = useState('')
  const [topicOptions, setTopicOptions] = useState<string[]>([])
  const [topicCache, setTopicCache] = useState<Record<string, string[]>>({})

  const normalizeLabel = (value: string) => value.trim().toLocaleLowerCase()
  const gradeSubjects = selectedGrade ? getSubjectsForGrade(selectedGrade) : []
  const mergedSubjects = selectedGrade && fan.trim() && !gradeSubjects.some((subject) => normalizeLabel(subject.name) === normalizeLabel(fan))
    ? [...gradeSubjects, { id: 'custom-subject', name: fan.trim() }]
    : gradeSubjects

  const applyTopicPayload = (payload: AiCurriculumTopicsPayload) => {
    setTopicOptions(payload.mavzular)
    setTopicCache((prev) => ({
      ...prev,
      [`${payload.sinf}__${normalizeLabel(payload.fan)}`]: payload.mavzular,
    }))
    if (!payload.mavzular.some((topic) => normalizeLabel(topic) === normalizeLabel(mavzu))) {
      setMavzu(payload.mavzular[0] ?? '')
    }
    setTopicsText(`${payload.mavzular.length} ta mavzu topildi.`)
  }

  const handleLoadTopics = async () => {
    const activeGrade = selectedGrade
    const activeSubject = fan.trim()
    if (!activeGrade) {
      setTopicsText("Avval sinfni tanlang.")
      return
    }
    if (!activeSubject) {
      setTopicsText("Avval fanni tanlang.")
      return
    }

    const cacheKey = `${activeGrade}__${normalizeLabel(activeSubject)}`
    const cachedTopics = topicCache[cacheKey]
    if (cachedTopics?.length) {
      applyTopicPayload({ sinf: activeGrade, fan: activeSubject, mavzular: cachedTopics })
      return
    }

    setIsTopicsBusy(true)
    setTopicsText(`${activeGrade} ${activeSubject} mavzulari topilmoqda...`)

    try {
      const payload = await generateAiCurriculumTopics({
        sinf: activeGrade,
        fan: activeSubject,
      })
      applyTopicPayload(payload)
    } catch (error) {
      setTopicsText(error instanceof Error ? error.message : "AI mavzularini topib bo'lmadi.")
    } finally {
      setIsTopicsBusy(false)
    }
  }

  const handleGenerate = async () => {
    setIsBusy(true)
    setStatusText('AI savollar yaratyapti...')

    try {
      const generated = await generateAiQuizBatch({
        sinf: selectedGrade || undefined,
        fan,
        mavzu,
        daraja,
        savollarSoni,
        rules: generatorRules,
      })
      const message = await onImport(generated)
      setStatusText(message)
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "AI savollarini yaratib bo'lmadi.")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Professional test generator</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">JSON test yaratish</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
          JSON only
        </span>
      </div>

      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{description}</p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Sinf bo'yicha generator</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Sinf tanlang, fan tanlang, keyin AI o'sha fan uchun mavzular ro'yxatini topadi.</p>
            </div>
            <button
              type="button"
              onClick={() => { void handleLoadTopics() }}
              disabled={isTopicsBusy || !selectedGrade || !fan.trim()}
              className={`whitespace-nowrap rounded-2xl bg-gradient-to-r px-4 py-2 text-xs font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${toneClass}`}
            >
              {isTopicsBusy ? 'Mavzu qidiryapti...' : 'Mavzularni topish'}
            </button>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <select
              value={selectedGrade}
              onChange={(event) => {
                const nextGrade = event.target.value as CurriculumGradeId | ''
                setSelectedGrade(nextGrade)
                setSelectedSubject('')
                setTopicOptions([])
                setTopicsText(nextGrade ? "Fan tanlang va mavzularni toping." : '')
              }}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="">Sinf tanlang</option>
              {CURRICULUM_GRADES.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(event) => {
                const nextSubject = event.target.value
                setSelectedSubject(nextSubject)
                setFan(nextSubject)
                setTopicOptions([])
                setTopicsText(nextSubject ? "Mavzularni topish tugmasini bosing." : '')
              }}
              disabled={!selectedGrade}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{selectedGrade ? 'Fan tanlang' : 'Avval sinf tanlang'}</option>
              {mergedSubjects.map((subject) => (
                <option key={`${selectedGrade}-${subject.id}`} value={subject.name}>{subject.name}</option>
              ))}
            </select>

            <select
              value={mavzu}
              onChange={(event) => setMavzu(event.target.value)}
              disabled={topicOptions.length === 0}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{topicOptions.length > 0 ? 'Mavzu tanlang' : 'Mavzular hali yuklanmagan'}</option>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {topicsText ? (
            <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600">
              {topicsText}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={fan}
            onChange={(event) => {
              const nextValue = event.target.value
              setFan(nextValue)
              if (selectedSubject && normalizeLabel(selectedSubject) !== normalizeLabel(nextValue)) {
                setSelectedSubject('')
              }
            }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
            placeholder="Fan"
          />
          <input
            value={mavzu}
            onChange={(event) => setMavzu(event.target.value)}
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
            placeholder="Mavzu"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px] xl:grid-cols-[minmax(0,1fr)_140px_auto]">
          <select
            value={daraja}
            onChange={(event) => setDaraja(event.target.value as AiQuizDifficulty)}
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
          <input
            type="number"
            min={1}
            max={10}
            value={savollarSoni}
            onChange={(event) => setSavollarSoni(Number(event.target.value) || 1)}
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-cyan-400"
            placeholder="Savollar soni"
          />
          <button
            type="button"
            onClick={() => { void handleGenerate() }}
            disabled={isBusy}
            className={`whitespace-nowrap rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${toneClass}`}
          >
            {isBusy ? 'AI ishlayapti...' : 'AI test qo‘shish'}
          </button>
        </div>
      </div>

      {statusText ? (
        <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-600">
          {statusText}
        </p>
      ) : null}
    </div>
  )
}

export default AiQuizImportPanel
