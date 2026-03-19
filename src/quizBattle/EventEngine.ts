import type { EventCard, EventType, TeamState } from './types.ts'

export const eventWeights: Record<EventType, number> = {
  bomb: 34,
  double: 28,
  swap: 14,
  bonus: 24,
}

export const eventMeta: Record<
  EventType,
  { icon: string; title: string; hint: string; accent: string }
> = {
  bomb: {
    icon: '💣',
    title: 'Bomba Hodisasi',
    hint: 'Jamoa ochirgan karta qiymatida ball yo`qotadi.',
    accent: 'from-rose-500 to-orange-500',
  },
  double: {
    icon: '⭐',
    title: 'Ikki Karra Hodisa',
    hint: 'Keyingi tog`ri javob 2x ball beradi.',
    accent: 'from-amber-400 to-yellow-500',
  },
  swap: {
    icon: '🔄',
    title: 'Almashtirish Hodisasi',
    hint: 'Joriy jamoa boshqa jamoa bilan hisobni almashtiradi.',
    accent: 'from-sky-500 to-indigo-500',
  },
  bonus: {
    icon: '🎁',
    title: 'Bonus Hodisasi',
    hint: 'Jamoa darhol bonus ball oladi.',
    accent: 'from-emerald-400 to-teal-500',
  },
}

const weightedEntries = Object.entries(eventWeights) as Array<[EventType, number]>

export const pickWeightedEvent = (rng: () => number = Math.random): EventType => {
  const total = weightedEntries.reduce((sum, [, weight]) => sum + weight, 0)
  let cursor = rng() * total

  for (const [eventType, weight] of weightedEntries) {
    cursor -= weight
    if (cursor <= 0) {
      return eventType
    }
  }

  return 'bomb'
}

export const buildEventCard = (id: string, points: number, eventType: EventType): EventCard => {
  const meta = eventMeta[eventType]
  return {
    id,
    points,
    type: 'event',
    question: `${meta.icon} ${meta.title}`,
    answers: [],
    correctAnswer: '',
    eventType,
  }
}

export type EventResolution = {
  scoreDeltaByTeam: number[]
  grantDouble: boolean
  swapWithTeamIndex: number | null
  message: string
}

const findSwapTargetIndex = (activeTeamIndex: number, teams: TeamState[]) => {
  const candidates = teams
    .map((team, index) => ({ team, index }))
    .filter(({ index }) => index !== activeTeamIndex)

  if (candidates.length === 0) return null

  return candidates.sort((a, b) => b.team.score - a.team.score)[0].index
}

export const resolveEvent = (
  eventType: EventType,
  points: number,
  activeTeamIndex: number,
  teams: TeamState[],
): EventResolution => {
  const safePoints = Math.max(points, 5)
  const scoreDeltaByTeam = teams.map(() => 0)

  if (eventType === 'bomb') {
    scoreDeltaByTeam[activeTeamIndex] = -safePoints
    return {
      scoreDeltaByTeam,
      grantDouble: false,
      swapWithTeamIndex: null,
      message: `Bomba: -${safePoints} ball`,
    }
  }

  if (eventType === 'bonus') {
    scoreDeltaByTeam[activeTeamIndex] = safePoints
    return {
      scoreDeltaByTeam,
      grantDouble: false,
      swapWithTeamIndex: null,
      message: `Bonus: +${safePoints} ball`,
    }
  }

  if (eventType === 'double') {
    return {
      scoreDeltaByTeam,
      grantDouble: true,
      swapWithTeamIndex: null,
      message: 'Ikki karra aktiv: keyingi tog`ri javob 2x',
    }
  }

  return {
    scoreDeltaByTeam,
    grantDouble: false,
    swapWithTeamIndex: findSwapTargetIndex(activeTeamIndex, teams),
    message: 'Almashtirish: hisoblar o`rin almashadi',
  }
}
