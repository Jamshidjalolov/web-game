export type CurriculumGradeId =
  | '1-sinf'
  | '2-sinf'
  | '3-sinf'
  | '4-sinf'
  | '5-sinf'
  | '6-sinf'
  | '7-sinf'
  | '8-sinf'
  | '9-sinf'
  | '10-sinf'
  | '11-sinf'

export type CurriculumSubject = {
  id: string
  name: string
}

export const CURRICULUM_GRADES: CurriculumGradeId[] = [
  '1-sinf',
  '2-sinf',
  '3-sinf',
  '4-sinf',
  '5-sinf',
  '6-sinf',
  '7-sinf',
  '8-sinf',
  '9-sinf',
  '10-sinf',
  '11-sinf',
]

const subjectCatalog: CurriculumSubject[] = [
  { id: 'mother_tongue_literacy', name: "Ona tili va o'qish savodxonligi" },
  { id: 'mother_tongue', name: "Ona tili" },
  { id: 'literature', name: 'Adabiyot' },
  { id: 'math', name: 'Matematika' },
  { id: 'algebra', name: 'Algebra' },
  { id: 'geometry', name: 'Geometriya' },
  { id: 'natural_science', name: 'Tabiiy fan' },
  { id: 'biology', name: 'Biologiya' },
  { id: 'physics', name: 'Fizika' },
  { id: 'chemistry', name: 'Kimyo' },
  { id: 'history_uzb', name: "O'zbekiston tarixi" },
  { id: 'history_world', name: 'Jahon tarixi' },
  { id: 'history', name: 'Tarix' },
  { id: 'geography', name: 'Geografiya' },
  { id: 'informatics', name: 'Informatika' },
  { id: 'english', name: 'Ingliz tili' },
  { id: 'russian', name: 'Rus tili' },
  { id: 'education', name: 'Tarbiya' },
  { id: 'technology', name: 'Texnologiya' },
  { id: 'art', name: "Tasviriy san'at" },
  { id: 'music', name: 'Musiqa' },
  { id: 'pe', name: 'Jismoniy tarbiya' },
  { id: 'civics', name: 'Huquq va fuqarolik asoslari' },
  { id: 'economics', name: 'Iqtisodiyot asoslari' },
]

const gradeSubjectIds: Record<CurriculumGradeId, string[]> = {
  '1-sinf': ['mother_tongue_literacy', 'math', 'natural_science', 'education', 'art', 'music', 'technology', 'english', 'pe'],
  '2-sinf': ['mother_tongue_literacy', 'math', 'natural_science', 'education', 'art', 'music', 'technology', 'english', 'pe'],
  '3-sinf': ['mother_tongue_literacy', 'math', 'natural_science', 'education', 'art', 'music', 'technology', 'english', 'pe'],
  '4-sinf': ['mother_tongue_literacy', 'math', 'natural_science', 'education', 'art', 'music', 'technology', 'english', 'pe'],
  '5-sinf': ['mother_tongue', 'literature', 'math', 'natural_science', 'history', 'geography', 'informatics', 'education', 'technology', 'english', 'russian', 'pe'],
  '6-sinf': ['mother_tongue', 'literature', 'math', 'natural_science', 'history', 'geography', 'informatics', 'education', 'technology', 'english', 'russian', 'pe'],
  '7-sinf': ['mother_tongue', 'literature', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'history_uzb', 'history_world', 'geography', 'informatics', 'education', 'english', 'russian', 'pe'],
  '8-sinf': ['mother_tongue', 'literature', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'history_uzb', 'history_world', 'geography', 'informatics', 'education', 'english', 'russian', 'pe'],
  '9-sinf': ['mother_tongue', 'literature', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'history_uzb', 'history_world', 'geography', 'informatics', 'education', 'english', 'russian', 'pe'],
  '10-sinf': ['mother_tongue', 'literature', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'history_uzb', 'history_world', 'geography', 'informatics', 'english', 'russian', 'civics', 'economics', 'pe'],
  '11-sinf': ['mother_tongue', 'literature', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'history_uzb', 'history_world', 'geography', 'informatics', 'english', 'russian', 'civics', 'economics', 'pe'],
}

export const getSubjectsForGrade = (grade: CurriculumGradeId): CurriculumSubject[] => {
  const allowedIds = new Set(gradeSubjectIds[grade] ?? [])
  return subjectCatalog.filter((subject) => allowedIds.has(subject.id))
}
