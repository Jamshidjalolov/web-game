import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import FooterCTA from '../components/FooterCTA.tsx'
import Navbar from '../components/Navbar.tsx'
import {
  AUTH_SESSION_CHANGE_EVENT,
  fetchAdminGameComments,
  fetchUsersForAdmin,
  loadStoredAuthSession,
  moderateGameComment,
  type ApiUser,
  type GameComment,
  type GameCommentStatus,
} from '../lib/backend.ts'

const statusOptions: GameCommentStatus[] = ['pending', 'approved', 'rejected']

function AdminDashboardPage() {
  const [session, setSession] = useState(() => loadStoredAuthSession())
  const [users, setUsers] = useState<ApiUser[]>([])
  const [comments, setComments] = useState<GameComment[]>([])
  const [filterStatus, setFilterStatus] = useState<GameCommentStatus | 'all'>('pending')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [statusText, setStatusText] = useState('')

  const isAdmin = session?.user.role === 'admin'

  const pendingCount = useMemo(
    () => comments.filter((comment) => comment.status === 'pending').length,
    [comments],
  )

  const loadDashboard = async (status: GameCommentStatus | 'all') => {
    setLoading(true)
    setStatusText('')
    try {
      const [nextUsers, nextComments] = await Promise.all([
        fetchUsersForAdmin(),
        fetchAdminGameComments(status === 'all' ? undefined : status),
      ])
      setUsers(nextUsers)
      setComments(nextComments)
      setReplyDrafts(Object.fromEntries(nextComments.map((comment) => [comment.id, comment.admin_reply ?? ''])))
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Admin panel yuklanmadi.")
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    if (!isAdmin) return
    void loadDashboard(filterStatus)
  }, [filterStatus, isAdmin])

  if (!session?.accessToken) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const handleModerate = async (commentId: string, nextStatus?: GameCommentStatus) => {
    const adminReply = replyDrafts[commentId] ?? ''
    try {
      const updated = await moderateGameComment(commentId, {
        status: nextStatus,
        adminReply,
      })
      setComments((prev) => prev.map((comment) => (comment.id === updated.id ? updated : comment)))
      setStatusText("Izoh yangilandi.")
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Izoh yangilanmadi.")
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#edf7ff_0%,#f5fbff_46%,#fff4dd_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_24%_82%,rgba(250,204,21,0.16),transparent_22%)]" />
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1480px] px-4 pb-16 pt-10 sm:px-6">
          <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-soft backdrop-blur-xl sm:p-7">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-indigo-700">
                  Admin profil
                </p>
                <h1 className="mt-3 font-kid text-5xl text-slate-900 sm:text-6xl">Admin panel</h1>
                <p className="mt-3 text-lg font-bold text-slate-600">
                  Royhatdan o'tgan foydalanuvchilar, o'yin izohlari, moderatsiya va admin javoblari shu yerda boshqariladi.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Admin</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{session.user.full_name || session.user.email}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">role: admin</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Foydalanuvchilar</p>
                  <p className="mt-2 text-4xl font-black text-slate-900">{users.length}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Kutilayotgan izoh</p>
                  <p className="mt-2 text-4xl font-black text-slate-900">{pendingCount}</p>
                </div>
              </div>
            </div>

            {statusText ? (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700">
                {statusText}
              </p>
            ) : null}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Royhatdan o'tganlar</p>
                  <h2 className="mt-2 font-kid text-4xl text-slate-900 sm:text-5xl">Foydalanuvchilar</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-600">
                  {users.length} ta
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
                    Ma'lumot yuklanmoqda...
                  </div>
                ) : users.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
                    Foydalanuvchilar topilmadi.
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{user.full_name || user.email}</p>
                          <p className="text-xs font-bold text-slate-500">{user.email}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] ${
                          user.role === 'admin'
                            ? 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border border-slate-200 bg-white text-slate-600'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/85 bg-white/92 p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Moderatsiya</p>
                  <h2 className="mt-2 font-kid text-4xl text-slate-900 sm:text-5xl">O'yin izohlari</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Hammasi
                  </button>
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold capitalize transition ${filterStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
                    Izohlar yuklanmoqda...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
                    Hozircha izoh yo'q.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{comment.author_name}</p>
                          <p className="text-xs font-bold text-slate-500">
                            {comment.author_email} • {comment.game_title}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] ${
                          comment.status === 'approved'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : comment.status === 'rejected'
                              ? 'border border-rose-200 bg-rose-50 text-rose-700'
                              : 'border border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                          {comment.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-bold leading-7 text-slate-700">{comment.content}</p>

                      <textarea
                        value={replyDrafts[comment.id] ?? ''}
                        onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))}
                        rows={3}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-indigo-400"
                        placeholder="Admin javobini yozing..."
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleModerate(comment.id, 'approved')}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700"
                        >
                          Tasdiqlash
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleModerate(comment.id, 'rejected')}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-700"
                        >
                          Rad etish
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleModerate(comment.id)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700"
                        >
                          Javobni saqlash
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <div className="mt-6">
            <Link
              to="/games"
              className="ui-secondary-btn ui-secondary-btn--md inline-flex rounded-2xl px-5 py-3 text-sm font-extrabold"
            >
              O'yinlarga qaytish
            </Link>
          </div>
        </main>

        <FooterCTA />
      </div>
    </div>
  )
}

export default AdminDashboardPage
