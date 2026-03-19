import { Link } from 'react-router-dom'

type QuestionManagerLinkCardProps = {
  gameTitle: string
  itemCount: number
  canManage: boolean
  className?: string
  setupMode?: 'central-only' | 'local-and-central'
}

function QuestionManagerLinkCard({
  gameTitle,
  itemCount,
  canManage,
  className = '',
  setupMode = 'central-only',
}: QuestionManagerLinkCardProps) {
  const supportsLocalDrafts = setupMode === 'local-and-central'

  return (
    <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-5 ${className}`.trim()}>
      <p className="inline-flex rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-700">
        Test tizimi
      </p>
      <h3 className="mt-3 text-xl font-extrabold text-slate-900">
        {supportsLocalDrafts
          ? `${gameTitle} uchun teacher bank va tezkor lokal savollar`
          : `${gameTitle} uchun custom savollar endi markaziy joyda boshqariladi`}
      </h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
        {supportsLocalDrafts
          ? "Setup sahifasida tezkor lokal savollar qo`shishingiz mumkin. Teacher bank esa `Test tizimi` sahifasida saqlanadi, AI bilan to`ldiriladi va barcha teacher o`yinlarida ishlatiladi."
          : "O'yin setup sahifasidan qo'shish olib tashlandi. Teacher savollarini `Test tizimi` sahifasida qo'shing, AI bilan yarating yoki o'chiring."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Saqlangan savollar</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{itemCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Holat</p>
          <p className="mt-1 text-sm font-extrabold text-slate-700">
            {canManage ? 'Teacher boshqaruvi ochiq' : 'Teacher akkaunti kerak'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to={canManage ? '/questions' : '/login'}
          className="inline-flex rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
        >
          {canManage ? "Test tizimiga o'tish" : 'Teacher sifatida kirish'}
        </Link>
        <Link
          to="/games"
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
        >
          O'yinlarga qaytish
        </Link>
      </div>
    </div>
  )
}

export default QuestionManagerLinkCard
