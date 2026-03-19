import { Link } from 'react-router-dom'

type TeacherFeatureNoticeProps = {
  className?: string
}

function TeacherFeatureNotice({ className = '' }: TeacherFeatureNoticeProps) {
  return (
    <div className={`rounded-3xl border border-amber-200 bg-[linear-gradient(145deg,#fff9e6_0%,#fff4da_100%)] p-5 shadow-soft ${className}`.trim()}>
      <p className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
        Teacher rejimi
      </p>
      <h3 className="mt-3 text-xl font-extrabold text-slate-900">
        Custom savollar faqat teacher akkaunti bilan ochiladi
      </h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
        Teacher bo'lib ro'yxatdan kirgan foydalanuvchi faqat o'zi qo'shgan savollarni ko'radi.
        Mehmon yoki oddiy foydalanishda o'yin hozirgi standart savollar bilan ishlaydi.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/login"
          className="inline-flex rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
        >
          Teacher sifatida kirish
        </Link>
        <Link
          to="/games"
          className="inline-flex rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
        >
          O'yinlarga qaytish
        </Link>
      </div>
    </div>
  )
}

export default TeacherFeatureNotice
