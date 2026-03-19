import { useEffect, useState } from 'react'
import { AUTH_SESSION_CHANGE_EVENT, hasTeacherGameAccess } from '../lib/backend.ts'

function useTeacherGameAccess() {
  const [canUseTeacherGameContent, setCanUseTeacherGameContent] = useState(() => hasTeacherGameAccess())

  useEffect(() => {
    const syncAccess = () => setCanUseTeacherGameContent(hasTeacherGameAccess())
    const syncAccessFromEvent: EventListener = () => syncAccess()

    window.addEventListener('storage', syncAccess)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncAccessFromEvent)

    return () => {
      window.removeEventListener('storage', syncAccess)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncAccessFromEvent)
    }
  }, [])

  return canUseTeacherGameContent
}

export default useTeacherGameAccess
