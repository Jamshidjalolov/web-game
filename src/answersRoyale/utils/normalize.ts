export const normalizeBattleAnswer = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\u2019`]/g, "'")
    .replace(/\s+/g, ' ')

export const uniqueAnswers = (items: string[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const normalized = normalizeBattleAnswer(item)
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
