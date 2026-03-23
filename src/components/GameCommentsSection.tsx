import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AUTH_SESSION_CHANGE_EVENT,
  createGameComment,
  fetchApprovedGameComments,
  loadStoredAuthSession,
  type GameComment,
} from '../lib/backend.ts'

type GameCommentsSectionProps = {
  gameId: string
  gameTitle: string
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function GameCommentsSection({ gameId, gameTitle }: GameCommentsSectionProps) {
  const [session, setSession] = useState(() => loadStoredAuthSession())
  const [comments, setComments] = useState<GameComment[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('')

  const isAuthenticated = Boolean(session?.accessToken)
  const commentCountLabel = useMemo(() => `${comments.length} ta tasdiqlangan izoh`, [comments.length])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const next = await fetchApprovedGameComments(gameId)
      setComments(next)
    } catch {
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadComments()
  }, [gameId])

  useEffect(() => {
    const syncSession = () => setSession(loadStoredAuthSession())
    const syncFromEvent: EventListener = () => syncSession()
    window.addEventListener('storage', syncSession)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncFromEvent)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncFromEvent)
    }
  }, [])

  const handleSubmit = async () => {
    const content = draft.trim()
    if (content.length < 3) {
      setStatusText("Izoh kamida 3 ta belgidan iborat bo'lsin.")
      return
    }

    setIsSubmitting(true)
    setStatusText('')
    try {
      await createGameComment({ gameId, content })
      setDraft('')
      setStatusText("Izoh adminga yuborildi. Tasdiqlangach shu sahifada ko'rinadi.")
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Izoh yuborilmadi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">Hamjamiyat fikri</p>
          <h2 className="mt-2 font-kid text-4xl text-slate-900 sm:text-5xl">{gameTitle} izohlari</h2>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Har bir izoh avval admin panelga tushadi. Admin tasdiqlasa, shu yerda chiqadi.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-600">
          {commentCountLabel}
        </span>
      </div>

      <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
        {isAuthenticated ? (
          <>
            <p className="text-sm font-extrabold text-slate-800">
              {session?.user.full_name || session?.user.email || 'Foydalanuvchi'} sifatida izoh yozyapsiz
            </p>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-indigo-400"
              placeholder="O'yin haqidagi fikringizni yozing..."
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-500">
                Admin javob yozsa, tasdiqlangan izoh ostida ko'rinadi.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ui-accent-btn rounded-2xl px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Izoh yuborish'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-800">Izoh yozish uchun login kerak.</p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Login bo'lgach izoh yozasiz, admin tasdiqlagach hamma ko'radi.
              </p>
            </div>
            <Link
              to="/login"
              className="ui-secondary-btn ui-secondary-btn--md inline-flex rounded-2xl px-5 py-3 text-sm font-extrabold"
            >
              Login qilish
            </Link>
          </div>
        )}

        {statusText ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700">
            {statusText}
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
            Izohlar yuklanmoqda...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
            Hozircha tasdiqlangan izoh yo'q. Birinchi izohni siz yozing.
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{comment.author_name}</p>
                  <p className="text-xs font-bold text-slate-500">{formatDateTime(comment.created_at)}</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                  Tasdiqlangan
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-7 text-slate-700">{comment.content}</p>

              {comment.admin_reply ? (
                <div className="game-comments-admin-reply mt-3 rounded-[1.1rem] border border-indigo-200 bg-indigo-50 px-4 py-3">
                  <p className="game-comments-admin-reply-meta text-xs font-extrabold uppercase tracking-[0.14em] text-indigo-600">
                    Admin javobi{comment.moderator_name ? ` • ${comment.moderator_name}` : ''}
                  </p>
                  <p className="game-comments-admin-reply-text mt-2 text-sm font-bold leading-6 text-slate-700">
                    {comment.admin_reply}
                  </p>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default GameCommentsSection
