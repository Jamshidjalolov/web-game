import type { TezkorGuruhQuestion } from '../types.ts'

export const DEFAULT_TEZKOR_GURUH_QUESTIONS: TezkorGuruhQuestion[] = [
  {
    id: 'q1',
    question: 'Rasmda nechta uchburchak mavjud?',
    options: ['8', '10', '12', '14'],
    correctAnswer: '12',
    difficulty: 'easy',
  },
  {
    id: 'q2',
    question: '5 + 7 = ?',
    options: ['10', '11', '12', '13'],
    correctAnswer: '12',
    difficulty: 'easy',
  },
  {
    id: 'q3',
    question: '“Maktab” so‘zining raqamli qiymati nechiga teng (A=1, B=2, ...)?',
    options: ['65', '60', '55', '70'],
    correctAnswer: '70',
    difficulty: 'medium',
  },
  {
    id: 'q4',
    question: 'Kelajakda nima qilasiz? Bu so‘z qaysi zamonda?',
    options: ['O‘tgan', 'Hozirgi', 'Kelajak', 'Shart'],
    correctAnswer: 'Kelajak',
    difficulty: 'easy',
  },
  {
    id: 'q5',
    question: '12 sonining yarmisi nechiga teng?',
    options: ['6', '8', '4', '10'],
    correctAnswer: '6',
    difficulty: 'easy',
  },
  {
    id: 'q6',
    question: 'Qaysi kesma to‘g‘ri kvadrat shaklidagi rasmni ifodalaydi?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'B',
    difficulty: 'hard',
  },
  {
    id: 'q7',
    question: '“Sevgi” so‘zida nechta unli harf bor?',
    options: ['2', '3', '1', '4'],
    correctAnswer: '2',
    difficulty: 'medium',
  },
  {
    id: 'q8',
    question: '5*7 qanday natija beradi?',
    options: ['35', '30', '40', '32'],
    correctAnswer: '35',
    difficulty: 'easy',
  },
  {
    id: 'q9',
    question: 'Agar “olma” 5 ta bo‘lsa, 3 dona qancha bo‘ladi?',
    options: ['8', '15', '3', '12'],
    correctAnswer: '15',
    difficulty: 'easy',
  },
  {
    id: 'q10',
    question: 'Uyqusizlikda eng muhim narsa nima?',
    options: ['Yaxshi ovqat', 'Ko‘proq dam olish', 'Tezroq o‘rganish', 'Ko‘p kitob o‘qish'],
    correctAnswer: 'Ko‘proq dam olish',
    difficulty: 'medium',
  },
]
