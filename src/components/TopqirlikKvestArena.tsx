import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import ConfettiOverlay from './ConfettiOverlay'
import questionShapesUrl from '../assets/topqirlik/question-shapes.svg?url'
import questionCalendarUrl from '../assets/topqirlik/question-calendar.svg?url'
import questionAnimalsUrl from '../assets/topqirlik/question-animals.svg?url'
import questionFlightUrl from '../assets/topqirlik/question-flight.svg?url'
import questionNumbersUrl from '../assets/topqirlik/question-numbers.svg?url'
import questionSchoolUrl from '../assets/topqirlik/question-school.svg?url'
import questionLogicUrl from '../assets/topqirlik/question-logic.svg?url'

type Difficulty = 'Oson' | "O'rta" | 'Qiyin'
type Side = 'left' | 'right'
type TeamStatus = 'waiting' | 'correct' | 'wrong' | 'timeout' | 'done'
type InputKind = 'number' | 'text'
type OptionVisualKind = 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'heptagon' | 'circle'

type ChoiceTask = {
  id: string
  type: 'choice'
  prompt: string
  options: string[]
  correctIndex: number
  optionVisuals?: (OptionVisualKind | null)[]
}

type InputTask = {
  id: string
  type: 'input'
  prompt: string
  answer: string
  inputKind: InputKind
  placeholder: string
}

type KvestTask = ChoiceTask | InputTask

type DifficultyConfig = {
  questionCount: number
  secondsPerQuestion: number
  basePoints: number
  speedBonus: number
  streakBonus: number
  autoNextMs: number
}

type TeamProgress = {
  index: number
  score: number
  correct: number
  streak: number
  bestStreak: number
  timeLeft: number
  status: TeamStatus
  locked: boolean
  selectedChoice: number | null
  inputValue: string
  lastGain: number
  advanceToken: number
  finished: boolean
  lastNote: string
}

type TopqirlikKvestArenaProps = {
  gameTitle: string
  gameTone: string
  leftTeamName?: string
  rightTeamName?: string
  initialDifficulty?: Difficulty
  teacherQuestions?: TeacherKvestQuestion[]
  setupPath?: string
}

type QuestionArtKind = 'shapes' | 'calendar' | 'animals' | 'flight' | 'numbers' | 'school' | 'logic'

export type TeacherKvestQuestion = {
  prompt: string
  options: string[]
  correctIndex: number
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Oson: {
    questionCount: 10,
    secondsPerQuestion: 30,
    basePoints: 72,
    speedBonus: 2,
    streakBonus: 8,
    autoNextMs: 1500,
  },
  "O'rta": {
    questionCount: 10,
    secondsPerQuestion: 30,
    basePoints: 88,
    speedBonus: 3,
    streakBonus: 11,
    autoNextMs: 1400,
  },
  Qiyin: {
    questionCount: 10,
    secondsPerQuestion: 30,
    basePoints: 104,
    speedBonus: 4,
    streakBonus: 14,
    autoNextMs: 1300,
  },
}

const choice = (
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  optionVisuals?: (OptionVisualKind | null)[],
): ChoiceTask => ({
  id,
  type: 'choice',
  prompt,
  options,
  correctIndex,
  optionVisuals,
})

const numberInput = (id: string, prompt: string, answer: string): InputTask => ({
  id,
  type: 'input',
  prompt,
  answer,
  inputKind: 'number',
  placeholder: 'Raqam kiriting',
})

const textInput = (id: string, prompt: string, answer: string): InputTask => ({
  id,
  type: 'input',
  prompt,
  answer,
  inputKind: 'text',
  placeholder: 'Javob yozing',
})

const CURATED_SHARED_QUESTIONS: ChoiceTask[] = [
  choice(
    'curated-1',
    'Bir xona ichida 6 ta odam bor. Har biri har bir boshqa odam bilan qo‘l siqqan. Nechta qo‘l siqish bo‘ldi?',
    ['15', '12', '18', '20'],
    0,
  ),
  choice('curated-2', 'Ketma-ketlik: 1, 3, 6, 10, 15, 21, ?', ['27', '28', '30', '36'], 1),
  choice(
    'curated-3',
    '3 ota va 3 o‘g‘il 3 ta baliqni teng bo‘lishdi, har biriga bittadan tushdi. Qanday?',
    ['6 kishi', '4 kishi', '3 kishi', '5 kishi'],
    2,
  ),
  choice(
    'curated-4',
    'Bir xona ichida 4 burchak bor. Har burchakda 1 mushuk. Har biri 3 tasiga qarab turibdi. Nechta mushuk bor?',
    ['4', '8', '12', '16'],
    0,
  ),
  choice(
    'curated-5',
    '3 lampochka va 3 kalit bor. Faqat 1 marta yoqish bilan qaysi lampochka qaysi kalitga tegishli ekanini aniqlash mumkin. Qanday?',
    ['Tasodifiy yoqish', 'Kalitlarni yozib olish', 'Issiqlik bilan farqlash', 'Imkoni yo‘q'],
    2,
  ),
  choice('curated-6', '1, 11, 21, 1211, 111221, ?', ['312211', '131122', '112213', '221121'], 0),
  choice('curated-7', 'Ketma-ketlik: 2, 12, 30, 56, 90, ?', ['120', '132', '140', '150'], 1),
  choice(
    'curated-8',
    'Bir kishi 100 metr yuradi, har qadamda 3 m chiqib, 2 m tushadi. Necha qadamda oxirgi nuqtaga yetadi?',
    ['97', '98', '99', '100'],
    2,
  ),
  choice('curated-9', 'Ketma-ketlikni toping: 1, 4, 5, 6, 7, 9, 11, ?', ['12', '13', '14', '15'], 1),
  choice('curated-10', 'Ketma-ketlik: 3×3=9, 4×4=16, 5×5=?', ['20', '25', '30', '35'], 1),

  choice('curated-11', 'Bir odam ikki raqamni qo‘shdi: 7 va 8. Natija 2 chiqdi. Qanday?', ['Soat matematikasi', 'Hujum noto‘g‘ri', 'Qoidalar xato', 'Tasodif'], 0),
  choice('curated-12', '10 metrli quduqda toshbaqa har kuni 3 m chiqib, 2 m tushadi. Necha kunda chiqadi?', ['7', '8', '9', '10'], 1),
  choice('curated-13', 'Bir kishi 1 soatlik uchrashuvni daqiqaga aylantirdi. Necha soniya bo‘ladi?', ['3600', '1800', '600', '7200'], 0),
  choice('curated-14', 'Ranglar ketma-ketligi: Qizil, Ko‘k, Yashil, Qizil, Ko‘k, ?', ['Qizil', 'Ko‘k', 'Yashil', 'Sariq'], 2),
  choice('curated-15', '1 kg temir va 1 kg paxta. Qaysi og‘ir?', ['Temir', 'Paxta', 'Teng', 'Bilmayman'], 2),
  choice('curated-16', 'Bir xona ichida 5 sham yonib turibdi. 2 tasi o‘chirildi. Nechta sham qoladi?', ['5', '3', '2', '0'], 1),
  choice('curated-17', 'Ketma-ketlikni davom ettiring: 1, 4, 9, 16, 25, ?', ['30', '36', '49', '42'], 1),
  choice('curated-18', '3×3×3×3… ketma-ketlikdagi 5-raqam?', ['81', '64', '125', '243'], 3),
  choice(
    'curated-19',
    'Bir xona ichida 3 qizil, 3 yashil, 3 ko‘k shar bor. Ko‘zingizni yumib nechta olsangiz, ikki tasi bir xil rang bo‘ladi?',
    ['3', '4', '5', '6'],
    2,
  ),
  choice('curated-20', 'Ketma-ketlik: 1, 3, 6, 10, 15, ?', ['21', '25', '20', '22'], 0),

  choice('curated-21', 'Bir odam 10-qavatdan sakradi va tirik qoldi. Qanday?', ['Pastga emas sakradi', '1-qavat ichida sakradi', 'Suvga tushdi', 'Superqahramon'], 1),
  choice('curated-22', 'Bir stolning 4 burchagi bor. 1 burchagini kesib tashlasak nechta qoladi?', ['3', '4', '5', '6'], 2),
  choice('curated-23', '10 ta sham yonib turibdi. 3 tasi o‘chdi. Nechta sham qoldi?', ['10', '7', '3', '0'], 1),
  choice('curated-24', '1 yil ichida nechta hafta bor?', ['48', '50', '52', '54'], 2),
  choice('curated-25', 'Eng kuchli mushak qaysi?', ['Qo‘l', 'Yurak', 'Til', 'Oyoq'], 1),
  choice(
    'curated-26',
    'Bir soat strelkalari 3:15 da orasidagi burchak nechchi gradus?',
    ['7.5°', '52.5°', '97.5°', '105°'],
    1,
  ),
  choice(
    'curated-27',
    'Bir poezd 100 km/soat tezlikda ketmoqda. Shamol Shimoldan esmoqda. Tutun qaysi tomonga ketadi?',
    ['Shimolga', 'G‘arbga', 'Poezd tomonga', 'Hech qayerga'],
    3,
  ),
  choice('curated-28', '3×3=9, 4×4=16, 5×5=? (Pattern reasoning)', ['20', '25', '30', '35'], 1),
  choice('curated-29', 'Bir odam 1000 ga 100 ni 5 marta qo‘shdi. Natija?', ['1500', '1600', '1400', '2000'], 1),
  choice('curated-30', '3 bola yugurmoqda. Ikkinchini quvib o‘tdingiz. Siz nechanchi o‘rindasiz?', ['1', '2', '3', '4'], 1),
]

const CURATED_RANGE_BY_DIFFICULTY: Record<Difficulty, [number, number]> = {
  Oson: [0, 10],
  "O'rta": [10, 20],
  Qiyin: [20, 30],
}

const QUESTION_POOLS: Record<Difficulty, KvestTask[]> = {
  Oson: [
    choice(
      'e-shape-1',
      "3 burchak, 4 burchak, 5 burchak... keyingi qaysi burchakli shakl?",
      ['3 burchak', '4 burchak', '5 burchak', '6 burchak'],
      3,
      ['triangle', 'square', 'pentagon', 'hexagon'],
    ),
    choice(
      'e-shape-2',
      "Qaysi shakl 5 burchakka ega?",
      ['Uchburchak', 'To`rtburchak', 'Beshburchak', 'Doira'],
      2,
      ['triangle', 'square', 'pentagon', 'circle'],
    ),
    choice('e-1', '2, 4, 6, ? ketma-ketligida keyingi sonni toping.', ['7', '8', '9', '10'], 1),
    choice('e-2', '5, 10, 15, ? ketma-ketligida keyingi son qaysi?', ['18', '20', '25', '30'], 1),
    choice('e-3', '1, 1, 2, 3, 5, ? ketma-ketligini davom ettiring.', ['6', '7', '8', '9'], 2),
    choice('e-4', "Qaysi biri boshqalaridan ortiqcha?", ['Olma', 'Nok', 'Banan', 'Stol'], 3),
    choice('e-5', "Barcha mushuklar hayvon. Momiq mushuk. Demak:", ['Momiq qush', 'Momiq hayvon', 'Momiq baliq', 'Momiq daraxt'], 1),
    choice('e-6', "Chap, chap, o`ng, chap, chap, ? naqshini davom ettiring.", ["Chap", "O`ng", "Yuqori", 'Past'], 1),
    choice('e-7', "Qaysi shakl boshqacha? (Uchburchak, To`rtburchak, Doira, Beshburchak)", ["Uchburchak", "To`rtburchak", 'Doira', 'Beshburchak'], 2),
    choice('e-8', "Bugun seshanba bo`lsa, ertadan keyingi kun qaysi?", ['Chorshanba', 'Payshanba', 'Juma', 'Dushanba'], 1),
    choice('e-9', "Qaysi javob to`g`ri? 10, 8, 6, 4, ?", ['1', '2', '3', '5'], 1),
    choice('e-10', "Qaysi so`z mantiqan boshqacha?", ['Kitob', 'Daftar', 'Ruchka', 'Daraxt'], 3),
    choice('e-11', '3 kishi: bobosi, ota va o`g`il birga turibdi. Nechta avlod bor?', ['1', '2', '3', '4'], 2),
    choice('e-12', "Qizil, ko`k, qizil, ko`k, ? ketma-ketligida keyingi rang.", ['Qizil', "Ko`k", 'Yashil', 'Sariq'], 0),
    choice('e-13', "Qaysi biri juftlik emas?", ['Kalit-qulf', 'Qalam-daftar', 'Oy-quyosh', 'Telefon-zaryad'], 2),
    choice('e-14', "A harfi 1, B harfi 2 bo`lsa, C harfi nechiga teng?", ['2', '3', '4', '5'], 1),
    choice('e-15', "1 kg paxta va 1 kg temirning og`irligi qanday?", ['Paxta og`ir', 'Temir og`ir', 'Teng', 'Bilinmaydi'], 2),
    choice('e-16', "Qaysi qatorda tartib o`sish bo`yicha?", ['9, 7, 5', '2, 4, 6', '8, 6, 7', '3, 3, 2'], 1),
    choice('e-17', "4 ta burchakli va 4 tomoni teng shakl qaysi?", ['Uchburchak', 'Kvadrat', 'Doira', 'Trapetsiya'], 1),
    choice('e-18', "Qaysi son ortiqcha: 3, 6, 9, 10", ['3', '6', '9', '10'], 3),
    choice('e-19', "Agar barcha olmalar meva bo`lsa, mevalar ichida olma bormi?", ['Ha', "Yo`q", 'Har doim emas', 'Bilinmaydi'], 0),
    choice('e-20', "Qaysi naqsh to`g`ri davom etadi? A, B, A, B, ?", ['C', 'A', 'D', 'Z'], 1),
  ],
  "O'rta": [
    choice(
      'm-shape-1',
      'Uchburchak -> 3, Kvadrat -> 4, Beshburchak -> 5. Hexagon nechaga teng?',
      ['4', '5', '6', '7'],
      2,
      [null, null, 'hexagon', null],
    ),
    choice(
      'm-shape-2',
      "Shakllar ketma-ketligi: ▲, ■, ⬟, ▲, ■, ?",
      ["Uchburchak", "To`rtburchak", 'Beshburchak', 'Doira'],
      2,
      ['triangle', 'square', 'pentagon', 'circle'],
    ),
    choice('m-1', '3, 6, 12, 24, ? ketma-ketligini davom ettiring.', ['30', '36', '42', '48'], 3),
    choice('m-2', '1, 4, 9, 16, ? ketma-ketligidagi keyingi son qaysi?', ['20', '24', '25', '27'], 2),
    choice('m-3', '2, 5, 10, 17, ? ketma-ketligidagi keyingi sonni toping.', ['24', '26', '28', '30'], 1),
    choice('m-4', 'A, C, F, J, ? ketma-ketligini davom ettiring.', ['L', 'M', 'N', 'O'], 3),
    choice('m-5', "Qaysi son ortiqcha: 2, 3, 5, 9, 11", ['2', '3', '5', '9'], 3),
    choice('m-6', "Barcha zorklar qizil. Hech bir qizil narsa ko`k emas. Demak zorklar:", ["Ko`k bo`lishi mumkin", "Ko`k emas", 'Faqat ko`k', 'Rangsiz'], 1),
    choice('m-7', "Qo`l : qo`lqop :: oyoq : ?", ['Paypoq', 'Shlyapa', 'Kamar', 'Ko`zoynak'], 0),
    choice('m-8', "Bir qator: Ali chapda, Vali o`ngda turibdi. O`rtada kim turishi mumkin?", ['Ikkisi ham emas', 'Uchinchi bola', 'Ali', 'Vali'], 1),
    choice('m-9', "Qaysi bayonot mantiqan to`g`ri?", ["Barcha qushlar baliq", "Ba`zi qushlar uchadi", 'Hech bir qush qanotli emas', 'Hamma narsa qush'], 1),
    choice('m-10', '8, 7, 5, 2, ? ketma-ketligini davom ettiring.', ['0', '-1', '1', '-2'], 1),
    choice('m-11', "Qaysi juftlik bir xil munosabatda? 'Qalam : yozish'", ['Pichoq : kesish', 'Stul : yugurish', 'Uy : ichish', 'Telefon : yotish'], 0),
    choice('m-12', "Sariqdan keyin har doim yashil kelsa, qator 'sariq, yashil, sariq, ...' keyingisi?", ['Ko`k', 'Yashil', 'Qizil', 'Sariq'], 1),
    choice('m-13', "Qaysi so`z boshqalariga nisbatan toifa jihatdan boshqa?", ['Olma', 'Nok', 'Meva', 'Banan'], 2),
    choice('m-14', "Agar bugun payshanba bo`lsa, 3 kundan keyin qaysi kun?", ['Shanba', 'Yakshanba', 'Dushanba', 'Juma'], 1),
    choice('m-15', '4, 8, 7, 14, 13, 26, ? ketma-ketligini davom ettiring.', ['25', '27', '28', '30'], 0),
    choice('m-16', "Qaysi son mantiqan mos keladi? 11, 22, 33, ?", ['44', '45', '43', '55'], 0),
    choice('m-17', "Agar barcha A lar B bo`lsa va barcha B lar C bo`lsa, unda barcha A lar...", ['A', 'B', 'C', "Yo`qoladi"], 2),
    choice('m-18', "Qaysi qator kamayish tartibida?", ['12, 9, 6, 3', '1, 3, 5, 7', '8, 8, 9, 10', '5, 2, 4, 1'], 0),
    choice('m-19', "Bir xil qoidalarga ko`ra: 2->4, 3->9, 4->16. 5-> ?", ['20', '22', '25', '30'], 2),
    choice('m-20', "Qaysi so`z mantiqan juft: 'Qulf' ga mos?", ['Kalit', 'Eshik', 'Deraza', 'Pol'], 0),
    choice('m-21', "Qaysi shakl ortiqcha? Kvadrat, To`g`ri to`rtburchak, Uchburchak, Kub", ['Kvadrat', "To`g`ri to`rtburchak", 'Uchburchak', 'Kub'], 3),
    choice('m-22', "Qizil > ko`k va ko`k > yashil bo`lsa, qaysi to`g`ri?", ['Yashil > qizil', "Qizil > yashil", "Ko`k = yashil", 'Hech qaysi'], 1),
  ],
  Qiyin: [
    choice(
      'h-shape-1',
      '3, 4, 5, 6 burchakli shakllar ketmoqda. Har safar burchak +1. 8 burchakdan oldingi qaysi?',
      ['5 burchak', '6 burchak', '7 burchak', '8 burchak'],
      2,
      ['pentagon', 'hexagon', 'heptagon', 'circle'],
    ),
    choice(
      'h-shape-2',
      "Qaysi shaklning burchagi yo`q, lekin naqshda ortiqcha element bo`lishi mumkin?",
      ['Uchburchak', 'Kvadrat', 'Doira', 'Beshburchak'],
      2,
      ['triangle', 'square', 'circle', 'pentagon'],
    ),
    choice('h-1', '2, 6, 12, 20, 30, ? ketma-ketligini davom ettiring.', ['36', '40', '42', '44'], 2),
    choice('h-2', '1, 2, 6, 24, ? ketma-ketligidagi keyingi son qaysi?', ['48', '96', '120', '720'], 2),
    choice('h-3', 'Agar barcha R lar S bo`lsa, ba`zi S lar T bo`lsa, qaysi xulosa aniq?', ['Barcha R lar T', "Ba`zi R lar T", 'Hech biri aniq emas', 'Barcha T lar R'], 2),
    choice('h-4', '3, 9, 27, 81, ? ketma-ketligini davom ettiring.', ['162', '243', '324', '729'], 1),
    choice('h-5', "Qaysi son ortiqcha: 8, 16, 24, 31, 40", ['8', '24', '31', '40'], 2),
    choice('h-6', "Ali Vali dan balandroq. Vali Hasan dan balandroq. Demak:", ['Hasan Ali dan baland', 'Ali Hasan dan baland', 'Vali Ali dan baland', 'Bilinmaydi'], 1),
    choice('h-7', 'A, D, H, M, ? ketma-ketligida keyingi harf qaysi?', ['Q', 'R', 'S', 'T'], 1),
    choice('h-8', "Agar 'KITOB' so`zi teskari yozilsa qaysi javob chiqadi?", ['BOTIK', 'BITOK', 'BOTKI', 'KOTIB'], 0),
    choice('h-9', '7, 14, 28, 56, 55, 110, ? ketma-ketligida keyingi sonni toping.', ['109', '111', '112', '120'], 0),
    choice('h-10', "Qaysi bayonot xato bo`lishi mumkin, lekin qolganlari to`g`ri bo`lsa ziddiyat chiqmaydi?", ['Barcha A lar B', "Ba`zi B lar A emas", 'Hech bir A B emas', "Ba`zi A lar B"], 1),
    choice('h-11', '1, 3, 6, 10, 15, ? ketma-ketligini davom ettiring.', ['18', '20', '21', '22'], 2),
    choice('h-12', "4 ta qutidan bittasida sovg`a bor. 1-quti emas, 2-quti ham emas, 4-quti emas. Qaysi qutida?", ['1', '2', '3', '4'], 2),
    choice('h-13', "Qaysi so`z juftligi bir xil mantiqda? 'Yozuvchi : kitob'", ['Rassom : rasm', 'Qish : sovuq', 'Maktab : sinf', 'Stol : xona'], 0),
    choice('h-14', '5, 11, 23, 47, ? ketma-ketligini davom ettiring.', ['83', '95', '96', '99'], 1),
    choice('h-15', "Agar bugun dushanba bo`lsa, 10 kundan keyin qaysi kun?", ['Chorshanba', 'Payshanba', 'Juma', 'Shanba'], 1),
    choice('h-16', "Qaysi qatorda naqsh bor: +1, +2, +3, +4 ?", ['4,5,7,10,14', '2,3,5,6,8', '1,2,4,5,6', '3,4,5,7,8'], 0),
    choice('h-17', 'AB, BC, CD, DE, ? ketma-ketligining keyingisi.', ['EF', 'FG', 'DF', 'EE'], 0),
    choice('h-18', "Bir odam bir hafta davomida har kuni 1 ta tugunni yechdi. 7-kuni nechta tugun yechilgan bo`ladi?", ['1', '5', '7', '14'], 2),
    choice('h-19', "Qaysi son mos: 121, 144, 169, ?", ['181', '196', '199', '225'], 1),
    choice('h-20', "Agar barcha tulporlar tez bo`lsa va hech bir sekin narsa tez bo`lmasa, tulporlar:", ['Sekin', 'Tez', 'Ikkalasi ham', 'Bilinmaydi'], 1),
    choice('h-21', '10, 9, 7, 4, 0, ? ketma-ketligini davom ettiring.', ['-3', '-4', '-5', '-6'], 2),
    choice('h-22', "Qaysi biri mantiqan ortiqcha? '1-yanvar, 2-fevral, 3-mart, 5-aprel'", ['1-yanvar', '2-fevral', '3-mart', '5-aprel'], 3),
    choice('h-23', 'Qator: 2, 3, 5, 8, 13, 21, ? keyingi son qaysi?', ['29', '31', '34', '35'], 2),
    choice('h-24', "Bir xil qoida: CAT->3, TRAIN->5, BOOK->? (unlilar soni)", ['1', '2', '3', '4'], 1),
  ],
}

const shuffle = <T,>(list: T[]) => {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = next[i]
    next[i] = next[j]
    next[j] = temp
  }
  return next
}

const cloneTask = (task: KvestTask, suffix: string): KvestTask => {
  if (task.type === 'choice') {
    return {
      ...task,
      options: [...task.options],
      optionVisuals: task.optionVisuals ? [...task.optionVisuals] : undefined,
      id: `${task.id}-${suffix}`,
    }
  }
  return {
    ...task,
    id: `${task.id}-${suffix}`,
  }
}

const pickTasks = (pool: KvestTask[], count: number, suffix: string) => {
  return shuffle(pool)
    .slice(0, count)
    .map((task, index) => cloneTask(task, `${suffix}-${index}`))
}

const toTeacherTask = (question: TeacherKvestQuestion, index: number): ChoiceTask | null => {
  const prompt = question.prompt.trim()
  const options = Array.isArray(question.options) ? question.options.map((item) => item.trim()) : []
  if (!prompt) return null
  if (options.length !== 4) return null
  if (options.some((item) => !item)) return null
  if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) return null

  return choice(`teacher-${index}`, prompt, options, question.correctIndex)
}

const buildDeck = (difficulty: Difficulty, count: number, sideSeed: string, teacherQuestions: TeacherKvestQuestion[]) => {
  const [curatedStart, curatedEnd] = CURATED_RANGE_BY_DIFFICULTY[difficulty]
  const curatedPool = CURATED_SHARED_QUESTIONS.slice(curatedStart, curatedEnd)
  const basePool = curatedPool.length > 0 ? curatedPool : QUESTION_POOLS[difficulty]
  const teacherPool = teacherQuestions
    .map((item, index) => toTeacherTask(item, index))
    .filter((item): item is ChoiceTask => Boolean(item))

  const teacherDeckCount = Math.min(count, teacherPool.length)
  const teacherDeck = teacherDeckCount > 0 ? pickTasks(teacherPool, teacherDeckCount, `${sideSeed}-teacher`) : []
  const generatedDeckCount = Math.max(0, count - teacherDeck.length)
  const generatedDeck = pickTasks(basePool, generatedDeckCount, `${sideSeed}-auto`)

  return shuffle([...teacherDeck, ...generatedDeck]).slice(0, count)
}

const buildTeamTasks = (difficulty: Difficulty, count: number, teacherQuestions: TeacherKvestQuestion[] = []) => {
  const shared = buildDeck(difficulty, count, 'shared', teacherQuestions)
  const left = shared.map((task, index) => cloneTask(task, `left-shared-${index}`))
  const right = shared.map((task, index) => cloneTask(task, `right-shared-${index}`))
  return { left, right }
}

const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

const SHAPE_POLYGON_POINTS: Record<Exclude<OptionVisualKind, 'circle'>, string> = {
  triangle: '50,8 92,84 8,84',
  square: '14,14 86,14 86,86 14,86',
  pentagon: '50,6 92,37 76,90 24,90 8,37',
  hexagon: '25,8 75,8 94,50 75,92 25,92 6,50',
  heptagon: '50,6 83,21 94,55 74,86 26,86 6,55 17,21',
}

function OptionShapeVisual({ kind, accentClass }: { kind: OptionVisualKind; accentClass: string }) {
  return (
    <div className={`relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accentClass} shadow`}>
      <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.32),transparent_52%)]" />
      <svg viewBox="0 0 100 100" className="relative h-8 w-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
        {kind === 'circle' ? (
          <circle cx="50" cy="50" r="34" fill="white" fillOpacity="0.96" />
        ) : (
          <polygon points={SHAPE_POLYGON_POINTS[kind]} fill="white" fillOpacity="0.96" />
        )}
      </svg>
    </div>
  )
}

type MiniObjectKind =
  | 'number'
  | 'calendar'
  | 'bird'
  | 'plane'
  | 'butterfly'
  | 'boy'
  | 'basket'
  | 'apple'
  | 'cat'
  | 'tree'
  | 'fish'
  | 'dog'
  | 'rock'
  | 'book'
  | 'pencil'
  | 'generic'

const monthTokens = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

const normalizeMiniText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[`'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const inferQuestionArt = (prompt: string, options: string[]): QuestionArtKind => {
  const text = normalizeMiniText(`${prompt} ${options.join(' ')}`)

  if (text.includes('burchak') || text.includes('shakl') || text.includes('hexagon') || text.includes('kvadrat')) {
    return 'shapes'
  }
  if (monthTokens.some((m) => text.includes(m)) || text.includes('oy 28') || text.includes('oy 28 kundan')) {
    return 'calendar'
  }
  if (text.includes('qush') || text.includes('samolyot') || text.includes('kapalak') || text.includes('uchol')) {
    return 'flight'
  }
  if (text.includes('mushuk') || text.includes('it') || text.includes('baliq') || text.includes('daraxt') || text.includes('suv')) {
    return 'animals'
  }
  if (/\d/.test(text) || text.includes('kun') || text.includes('son')) {
    return 'numbers'
  }
  if (text.includes('qalam') || text.includes('kitob') || text.includes('olma') || text.includes('savat') || text.includes('bola')) {
    return 'school'
  }
  return 'logic'
}

const QUESTION_ART_ASSET: Record<QuestionArtKind, string> = {
  shapes: questionShapesUrl,
  calendar: questionCalendarUrl,
  animals: questionAnimalsUrl,
  flight: questionFlightUrl,
  numbers: questionNumbersUrl,
  school: questionSchoolUrl,
  logic: questionLogicUrl,
}

function QuestionArtPanel({ task }: { task: KvestTask }) {
  const options = task.type === 'choice' ? task.options : []
  const artKind = inferQuestionArt(task.prompt, options)
  const src = QUESTION_ART_ASSET[artKind]

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Savol rasmi</p>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600">
          {artKind}
        </span>
      </div>
      <div className="relative h-40 bg-slate-50 sm:h-44">
        <img src={src} alt="Savol rasmi" className="h-full w-full object-cover object-center" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.18),transparent_44%),radial-gradient(circle_at_82%_78%,rgba(255,255,255,0.2),transparent_40%)]" />
      </div>
    </div>
  )
}

const inferMiniObject = (option: string, prompt: string): MiniObjectKind => {
  const o = normalizeMiniText(option)
  const p = normalizeMiniText(prompt)
  const text = `${o} ${p}`

  if (monthTokens.some((m) => text.includes(m)) || text.includes('oy') || text.includes('barchasi')) return 'calendar'
  if (/\d/.test(o) || o.includes('kun')) return 'number'
  if (text.includes('qush')) return 'bird'
  if (text.includes('samolyot') || text.includes('plane')) return 'plane'
  if (text.includes('kapalak') || text.includes('butterfly')) return 'butterfly'
  if (text.includes('savat') || text.includes('basket')) return 'basket'
  if (text.includes('olma') || text.includes('apple')) return 'apple'
  if (text.includes('bola') || text.includes('boy')) return 'boy'
  if (text.includes('mushuk') || text.includes('cat')) return 'cat'
  if (text.includes('daraxt') || text.includes('tree')) return 'tree'
  if (text.includes('baliq') || text.includes('fish')) return 'fish'
  if (text.includes('it ') || text.endsWith('it') || text.includes('dog')) return 'dog'
  if (text.includes('tosh') || text.includes('rock')) return 'rock'
  if (text.includes('kitob') || text.includes('book')) return 'book'
  if (text.includes('qalam') || text.includes('pencil') || text.includes('ruchka')) return 'pencil'
  return 'generic'
}

function MiniObjectVisual({
  option,
  prompt,
  accentClass,
  letter,
}: {
  option: string
  prompt: string
  accentClass: string
  letter: string
}) {
  const kind = inferMiniObject(option, prompt)
  const upper = option.toUpperCase()
  const compactText = upper.length > 8 ? upper.slice(0, 8) : upper

  if (kind === 'number') {
    return (
      <div className={`relative h-14 w-16 overflow-hidden rounded-xl border border-white/60 bg-gradient-to-br ${accentClass} shadow`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.45),transparent_50%)]" />
        <div className="absolute left-1.5 top-1 rounded-md bg-white/30 px-1 text-[9px] font-black text-white">{letter}</div>
        <div className="grid h-full place-items-center px-1 text-center">
          <span className="text-sm font-black leading-none text-white drop-shadow">
            {compactText}
          </span>
        </div>
      </div>
    )
  }

  if (kind === 'calendar') {
    const monthLabel = option.length > 9 ? option.slice(0, 9) : option
    return (
      <div className="h-14 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className={`h-4 bg-gradient-to-r ${accentClass}`} />
        <div className="px-1 pt-1 text-center text-[8px] font-black uppercase tracking-[0.08em] text-slate-700">
          {monthLabel}
        </div>
        <div className="mx-auto mt-1 grid w-12 grid-cols-4 gap-[2px] px-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`cal-${option}-${i}`} className="h-[3px] rounded-sm bg-slate-200" />
          ))}
        </div>
      </div>
    )
  }

  const icon = (() => {
    switch (kind) {
      case 'bird':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <ellipse cx="48" cy="58" rx="24" ry="18" fill="#60a5fa" />
            <circle cx="66" cy="42" r="10" fill="#93c5fd" />
            <polygon points="76,42 90,47 76,52" fill="#f59e0b" />
            <path d="M28 56 C10 45, 12 30, 34 36 C45 39, 43 48, 28 56Z" fill="#1d4ed8" />
            <circle cx="68" cy="40" r="2" fill="#111827" />
            <line x1="46" y1="74" x2="42" y2="86" stroke="#92400e" strokeWidth="3" />
            <line x1="54" y1="74" x2="56" y2="86" stroke="#92400e" strokeWidth="3" />
          </svg>
        )
      case 'plane':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <path d="M10 55 L64 45 C72 43 83 45 90 50 C83 55 72 57 64 55 L10 45 Z" fill="#60a5fa" />
            <path d="M44 46 L58 28 L66 30 L58 47 Z" fill="#1d4ed8" />
            <path d="M42 54 L54 74 L62 72 L54 53 Z" fill="#2563eb" />
            <rect x="18" y="46" width="26" height="8" rx="3" fill="#bfdbfe" />
          </svg>
        )
      case 'butterfly':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <ellipse cx="35" cy="42" rx="18" ry="14" fill="#fb923c" stroke="#111827" strokeWidth="3" />
            <ellipse cx="35" cy="63" rx="16" ry="12" fill="#fdba74" stroke="#111827" strokeWidth="3" />
            <ellipse cx="65" cy="42" rx="18" ry="14" fill="#fb923c" stroke="#111827" strokeWidth="3" />
            <ellipse cx="65" cy="63" rx="16" ry="12" fill="#fdba74" stroke="#111827" strokeWidth="3" />
            <rect x="47" y="28" width="6" height="44" rx="3" fill="#1f2937" />
            <line x1="50" y1="28" x2="42" y2="18" stroke="#1f2937" strokeWidth="2" />
            <line x1="50" y1="28" x2="58" y2="18" stroke="#1f2937" strokeWidth="2" />
          </svg>
        )
      case 'boy':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <circle cx="50" cy="28" r="14" fill="#fed7aa" />
            <path d="M37 26 C41 10,59 10,63 24 C55 19,45 19,37 26Z" fill="#7c2d12" />
            <rect x="34" y="42" width="32" height="24" rx="10" fill="#38bdf8" />
            <line x1="34" y1="50" x2="20" y2="58" stroke="#fed7aa" strokeWidth="7" strokeLinecap="round" />
            <line x1="66" y1="50" x2="80" y2="58" stroke="#fed7aa" strokeWidth="7" strokeLinecap="round" />
            <line x1="42" y1="66" x2="36" y2="88" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
            <line x1="58" y1="66" x2="64" y2="88" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
          </svg>
        )
      case 'basket':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <path d="M22 52 H78 L72 84 H28 Z" fill="#c2410c" />
            <path d="M32 52 C34 35, 66 35, 68 52" fill="none" stroke="#92400e" strokeWidth="5" />
            <circle cx="38" cy="58" r="6" fill="#ef4444" />
            <circle cx="50" cy="62" r="7" fill="#22c55e" />
            <circle cx="62" cy="58" r="6" fill="#f59e0b" />
          </svg>
        )
      case 'apple':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <circle cx="40" cy="60" r="16" fill="#ef4444" />
            <circle cx="60" cy="60" r="16" fill="#dc2626" />
            <rect x="48" y="30" width="4" height="12" rx="2" fill="#854d0e" />
            <path d="M52 34 C64 28,70 34,68 42 C60 44,56 40,52 34Z" fill="#22c55e" />
          </svg>
        )
      case 'cat':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <ellipse cx="50" cy="60" rx="24" ry="16" fill="#9ca3af" />
            <circle cx="34" cy="50" r="12" fill="#9ca3af" />
            <polygon points="26,41 31,31 36,41" fill="#9ca3af" />
            <polygon points="34,41 39,31 44,41" fill="#9ca3af" />
            <circle cx="31" cy="49" r="1.8" fill="#111827" />
            <circle cx="37" cy="49" r="1.8" fill="#111827" />
            <path d="M60 62 C72 66,76 72,74 82" fill="none" stroke="#6b7280" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )
      case 'tree':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <rect x="44" y="48" width="12" height="34" rx="4" fill="#92400e" />
            <circle cx="50" cy="38" r="20" fill="#4ade80" />
            <circle cx="34" cy="44" r="14" fill="#22c55e" />
            <circle cx="66" cy="44" r="14" fill="#16a34a" />
          </svg>
        )
      case 'fish':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <ellipse cx="45" cy="52" rx="22" ry="14" fill="#38bdf8" />
            <polygon points="66,52 86,40 86,64" fill="#0ea5e9" />
            <circle cx="38" cy="49" r="2" fill="#0f172a" />
            <path d="M38 59 C44 63,52 63,58 59" fill="none" stroke="#0369a1" strokeWidth="3" />
          </svg>
        )
      case 'dog':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <ellipse cx="50" cy="60" rx="22" ry="15" fill="#d97706" />
            <circle cx="34" cy="50" r="11" fill="#f59e0b" />
            <ellipse cx="26" cy="45" rx="5" ry="8" fill="#92400e" />
            <circle cx="31" cy="49" r="1.8" fill="#111827" />
            <line x1="58" y1="70" x2="58" y2="85" stroke="#78350f" strokeWidth="4" />
            <line x1="46" y1="70" x2="44" y2="85" stroke="#78350f" strokeWidth="4" />
          </svg>
        )
      case 'rock':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <path d="M18 75 L28 48 L52 38 L76 49 L84 74 Z" fill="#9ca3af" stroke="#6b7280" strokeWidth="4" />
            <path d="M34 62 L46 54 L58 60" fill="none" stroke="#6b7280" strokeWidth="3" />
          </svg>
        )
      case 'book':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <path d="M16 30 H46 C54 30 56 34 56 40 V78 H24 C19 78 16 75 16 70 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
            <path d="M84 30 H54 C46 30 44 34 44 40 V78 H76 C81 78 84 75 84 70 Z" fill="#fffbeb" stroke="#d97706" strokeWidth="3" />
            <line x1="50" y1="34" x2="50" y2="78" stroke="#b45309" strokeWidth="3" />
          </svg>
        )
      case 'pencil':
        return (
          <svg viewBox="0 0 100 100" className="h-11 w-11">
            <polygon points="18,74 64,28 82,46 36,92 16,94" fill="#22c55e" />
            <polygon points="64,28 72,20 90,38 82,46" fill="#fbbf24" />
            <polygon points="16,94 21,82 28,89" fill="#fca5a5" />
          </svg>
        )
      default:
        return (
          <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accentClass} text-lg font-black text-white shadow`}>
            {letter}
          </div>
        )
    }
  })()

  return (
    <div className="relative grid h-14 w-16 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-x-0 top-0 h-4 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.45),transparent_45%)]" />
      <div className="absolute right-1 top-1 rounded-md border border-slate-200 bg-slate-50 px-1 text-[9px] font-black text-slate-600">
        {letter}
      </div>
      {icon}
    </div>
  )
}

const createTeamState = (seconds: number): TeamProgress => ({
  index: 0,
  score: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  timeLeft: seconds,
  status: 'waiting',
  locked: false,
  selectedChoice: null,
  inputValue: '',
  lastGain: 0,
  advanceToken: 0,
  finished: false,
  lastNote: "Savolga javob bering.",
})

function TopqirlikKvestArena({
  gameTitle,
  gameTone,
  leftTeamName = '1-Jamoa',
  rightTeamName = '2-Jamoa',
  initialDifficulty = "O'rta",
  teacherQuestions = [],
  setupPath = '/games/topqirlik-kvest',
}: TopqirlikKvestArenaProps) {
  const config = DIFFICULTY_CONFIG[initialDifficulty]
  const leftLabel = leftTeamName.trim() || '1-Jamoa'
  const rightLabel = rightTeamName.trim() || '2-Jamoa'

  const [started, setStarted] = useState(false)
  const [matchFinished, setMatchFinished] = useState(false)
  const [winner, setWinner] = useState<Side | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [statusText, setStatusText] = useState(
    "Boshlash tugmasini bosing. Ikkala jamoaga bir xil mantiqiy savollar chiqadi, kim tezroq topishi muhim.",
  )

  const [leftTasks, setLeftTasks] = useState<KvestTask[]>([])
  const [rightTasks, setRightTasks] = useState<KvestTask[]>([])
  const [leftTeam, setLeftTeam] = useState<TeamProgress>(() =>
    createTeamState(config.secondsPerQuestion),
  )
  const [rightTeam, setRightTeam] = useState<TeamProgress>(() =>
    createTeamState(config.secondsPerQuestion),
  )
  const [roundAdvanceToken, setRoundAdvanceToken] = useState(0)
  const [isRoundSettled, setIsRoundSettled] = useState(false)

  const finishedRef = useRef(false)
  const roundSettledRef = useRef(false)

  const applyTeamUpdate = useCallback(
    (side: Side, updater: (prev: TeamProgress) => TeamProgress) => {
      if (side === 'left') {
        setLeftTeam(updater)
      } else {
        setRightTeam(updater)
      }
    },
    [],
  )

  const getCurrentTask = (side: Side): KvestTask | undefined => {
    if (side === 'left') return leftTasks[leftTeam.index]
    return rightTasks[rightTeam.index]
  }

  const finishMatch = useCallback(
    (winningSide: Side) => {
      if (finishedRef.current) return
      finishedRef.current = true
      setMatchFinished(true)
      setWinner(winningSide)
      setConfettiBurst((prev) => prev + 1)
      setShowWinnerModal(true)
      setStatusText(
        `${winningSide === 'left' ? leftLabel : rightLabel} eng ko'p ball bilan g'olib bo'ldi.`,
      )
    },
    [leftLabel, rightLabel],
  )

  const settleRound = useCallback((message: string) => {
    if (finishedRef.current || roundSettledRef.current) return
    roundSettledRef.current = true
    setIsRoundSettled(true)
    setStatusText(message)
    setRoundAdvanceToken((prev) => prev + 1)
  }, [])

  const pickWinnerByPoints = useCallback((leftState: TeamProgress, rightState: TeamProgress): Side => {
    if (leftState.score !== rightState.score) return leftState.score > rightState.score ? 'left' : 'right'
    if (leftState.correct !== rightState.correct) return leftState.correct > rightState.correct ? 'left' : 'right'
    if (leftState.bestStreak !== rightState.bestStreak) {
      return leftState.bestStreak > rightState.bestStreak ? 'left' : 'right'
    }
    return 'left'
  }, [])

  const advanceRound = useCallback(() => {
    if (!started || finishedRef.current) return

    const taskCount = Math.min(leftTasks.length, rightTasks.length)
    if (taskCount === 0) return

    const currentIndex = Math.max(leftTeam.index, rightTeam.index)
    const nextIndex = currentIndex + 1

    if (nextIndex >= taskCount) {
      setLeftTeam((prev) => ({
        ...prev,
        index: taskCount,
        finished: true,
        locked: true,
        status: 'done',
        timeLeft: 0,
        selectedChoice: null,
        inputValue: '',
        lastGain: 0,
        lastNote: "Barcha savollar tugadi.",
      }))
      setRightTeam((prev) => ({
        ...prev,
        index: taskCount,
        finished: true,
        locked: true,
        status: 'done',
        timeLeft: 0,
        selectedChoice: null,
        inputValue: '',
        lastGain: 0,
        lastNote: "Barcha savollar tugadi.",
      }))
      finishMatch(pickWinnerByPoints(leftTeam, rightTeam))
      return
    }

    roundSettledRef.current = false
    setIsRoundSettled(false)

    setLeftTeam((prev) => ({
      ...prev,
      index: nextIndex,
      timeLeft: config.secondsPerQuestion,
      status: 'waiting',
      locked: false,
      selectedChoice: null,
      inputValue: '',
      lastGain: 0,
      lastNote: `${nextIndex + 1}-savol ochildi. Birinchi bo'lib topishga harakat qiling.`,
    }))

    setRightTeam((prev) => ({
      ...prev,
      index: nextIndex,
      timeLeft: config.secondsPerQuestion,
      status: 'waiting',
      locked: false,
      selectedChoice: null,
      inputValue: '',
      lastGain: 0,
      lastNote: `${nextIndex + 1}-savol ochildi. Birinchi bo'lib topishga harakat qiling.`,
    }))

    setStatusText(`${nextIndex + 1}-savol ochildi. Ikkala jamoa bir xil savolda tezlik bo'yicha bellashadi.`)
  }, [
    config.secondsPerQuestion,
    finishMatch,
    leftTasks.length,
    leftTeam,
    pickWinnerByPoints,
    rightTasks.length,
    rightTeam,
    started,
  ])

  const registerAnswer = useCallback(
    (side: Side, isCorrect: boolean, answerText: string, selectedChoice: number | null) => {
      if (!started || finishedRef.current || roundSettledRef.current) return

      const team = side === 'left' ? leftTeam : rightTeam
      const otherSide: Side = side === 'left' ? 'right' : 'left'
      const otherTeam = otherSide === 'left' ? leftTeam : rightTeam
      const teamName = side === 'left' ? leftLabel : rightLabel
      const otherName = otherSide === 'left' ? leftLabel : rightLabel

      if (team.finished || team.locked) return

      const nextStreak = isCorrect ? team.streak + 1 : 0
      const gain = isCorrect
        ? config.basePoints + team.timeLeft * config.speedBonus + nextStreak * config.streakBonus
        : 0

      applyTeamUpdate(side, (prev) => {
        if (prev.finished || prev.locked || finishedRef.current) return prev

        return {
          ...prev,
          score: prev.score + gain,
          correct: isCorrect ? prev.correct + 1 : prev.correct,
          streak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          status: isCorrect ? 'correct' : 'wrong',
          locked: true,
          selectedChoice,
          lastGain: gain,
          lastNote: isCorrect
            ? `To'g'ri javob. +${gain} ball`
            : `Xato javob. To'g'ri javob: ${answerText}`,
          advanceToken: prev.advanceToken + 1,
        }
      })

      if (isCorrect) {
        applyTeamUpdate(otherSide, (prev) => {
          if (prev.finished || prev.locked || finishedRef.current) return prev
          return {
            ...prev,
            locked: true,
            status: 'waiting',
            lastGain: 0,
            lastNote: `${teamName} tezroq topdi. Bu raundda ball olmadi.`,
          }
        })

        settleRound(`${teamName} tezroq to'g'ri topdi. +${gain} ball. Keyingi savol ochiladi.`)
        return
      }

      const otherStillCanAnswer = !otherTeam.finished && !otherTeam.locked
      if (otherStillCanAnswer) {
        setStatusText(`${teamName} xato javob berdi. Endi ${otherName} shu savolga javob berishi mumkin.`)
        return
      }

      if (otherTeam.status === 'wrong' || otherTeam.status === 'timeout') {
        settleRound(`Ikkala jamoa ham bu savolda topolmadi. Keyingi savol ochiladi.`)
        return
      }

      setStatusText(`${teamName} xato javob berdi.`)
    },
    [
      applyTeamUpdate,
      config.basePoints,
      config.speedBonus,
      config.streakBonus,
      leftLabel,
      leftTeam,
      rightLabel,
      rightTeam,
      settleRound,
      started,
    ],
  )

  const registerTimeout = useCallback(
    (side: Side) => {
      if (!started || finishedRef.current || roundSettledRef.current) return

      const team = side === 'left' ? leftTeam : rightTeam
      const otherSide: Side = side === 'left' ? 'right' : 'left'
      const otherTeam = otherSide === 'left' ? leftTeam : rightTeam
      const teamName = side === 'left' ? leftLabel : rightLabel
      const otherName = otherSide === 'left' ? leftLabel : rightLabel

      if (team.finished || team.locked) return

      applyTeamUpdate(side, (prev) => {
        if (prev.finished || prev.locked || finishedRef.current) return prev
        return {
          ...prev,
          timeLeft: 0,
          locked: true,
          status: 'timeout',
          streak: 0,
          selectedChoice: null,
          lastGain: 0,
          advanceToken: prev.advanceToken + 1,
          lastNote: 'Vaqt tugadi.',
        }
      })

      const otherStillCanAnswer = !otherTeam.finished && !otherTeam.locked
      if (otherStillCanAnswer) {
        setStatusText(`${teamName}da vaqt tugadi. ${otherName} shu savolga javob berishi mumkin.`)
        return
      }

      if (otherTeam.status === 'wrong' || otherTeam.status === 'timeout') {
        settleRound(`Ikkala jamoa ham bu savolda javob bera olmadi. Keyingi savol ochiladi.`)
        return
      }

      setStatusText(`${teamName}da vaqt tugadi.`)
    },
    [applyTeamUpdate, leftLabel, leftTeam, rightLabel, rightTeam, settleRound, started],
  )

  const handleChoice = (side: Side, optionIndex: number) => {
    if (!started || matchFinished) return

    const team = side === 'left' ? leftTeam : rightTeam
    if (team.finished || team.locked) return

    const task = getCurrentTask(side)
    if (!task || task.type !== 'choice') return

    const isCorrect = optionIndex === task.correctIndex
    const answerText = task.options[task.correctIndex]
    registerAnswer(side, isCorrect, answerText, optionIndex)
  }

  const handleInputChange = (side: Side, value: string) => {
    if (!started || matchFinished) return

    const team = side === 'left' ? leftTeam : rightTeam
    const task = getCurrentTask(side)
    if (!task || task.type !== 'input') return
    if (team.finished || team.locked) return

    if (task.inputKind === 'number') {
      const cleaned = value.replace(/[^0-9\-]/g, '')
      applyTeamUpdate(side, (prev) => ({ ...prev, inputValue: cleaned.slice(0, 8) }))
      return
    }

    applyTeamUpdate(side, (prev) => ({ ...prev, inputValue: value.slice(0, 40) }))
  }

  const submitInput = (side: Side) => {
    if (!started || matchFinished) return

    const team = side === 'left' ? leftTeam : rightTeam
    if (team.finished || team.locked) return

    const task = getCurrentTask(side)
    if (!task || task.type !== 'input') return

    const raw = team.inputValue.trim()
    if (!raw) {
      setStatusText(`${side === 'left' ? leftLabel : rightLabel}: avval javob kiriting.`)
      return
    }

    const isCorrect =
      task.inputKind === 'number'
        ? raw === task.answer
        : normalizeAnswer(raw) === normalizeAnswer(task.answer)

    registerAnswer(side, isCorrect, task.answer, null)
  }

  const handleInputEnter = (side: Side, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    submitInput(side)
  }

  const startMatch = useCallback(() => {
    const { left, right } = buildTeamTasks(initialDifficulty, config.questionCount, teacherQuestions)
    setLeftTasks(left)
    setRightTasks(right)
    setLeftTeam(createTeamState(config.secondsPerQuestion))
    setRightTeam(createTeamState(config.secondsPerQuestion))
    setRoundAdvanceToken(0)
    setIsRoundSettled(false)
    setStarted(true)
    setMatchFinished(false)
    setWinner(null)
    setShowWinnerModal(false)
    finishedRef.current = false
    roundSettledRef.current = false
    setIsRoundSettled(false)
    setStatusText(
      `Bellashuv boshlandi. Bir xil savol chiqadi: kim tez va to'g'ri topadi, o'sha ball oladi.`,
    )
  }, [
    config.questionCount,
    config.secondsPerQuestion,
    initialDifficulty,
    leftLabel,
    rightLabel,
    teacherQuestions,
  ])

  const resetMatch = useCallback(() => {
    setStarted(false)
    setMatchFinished(false)
    setWinner(null)
    setShowWinnerModal(false)
    setRoundAdvanceToken(0)
    setIsRoundSettled(false)
    setLeftTasks([])
    setRightTasks([])
    setLeftTeam(createTeamState(config.secondsPerQuestion))
    setRightTeam(createTeamState(config.secondsPerQuestion))
    finishedRef.current = false
    roundSettledRef.current = false
    setStatusText(
      "Boshlash tugmasini bosing. Ikkala jamoaga bir xil mantiqiy savollar chiqadi, kim tezroq topishi muhim.",
    )
  }, [config.secondsPerQuestion])

  useEffect(() => {
    if (!started || matchFinished) return

    const hasActiveTeam =
      (!leftTeam.finished && !leftTeam.locked && leftTasks[leftTeam.index]) ||
      (!rightTeam.finished && !rightTeam.locked && rightTasks[rightTeam.index])

    if (!hasActiveTeam) return

  const timerId = window.setTimeout(() => {
      const leftWillTimeout =
        !leftTeam.finished && !leftTeam.locked && leftTeam.timeLeft <= 1
      const rightWillTimeout =
        !rightTeam.finished && !rightTeam.locked && rightTeam.timeLeft <= 1

      if (leftWillTimeout && rightWillTimeout) {
        setLeftTeam((prev) => {
          if (prev.finished || prev.locked) return prev
          return {
            ...prev,
            timeLeft: 0,
            locked: true,
            status: 'timeout',
            streak: 0,
            selectedChoice: null,
            lastGain: 0,
            advanceToken: prev.advanceToken + 1,
            lastNote: 'Vaqt tugadi.',
          }
        })
        setRightTeam((prev) => {
          if (prev.finished || prev.locked) return prev
          return {
            ...prev,
            timeLeft: 0,
            locked: true,
            status: 'timeout',
            streak: 0,
            selectedChoice: null,
            lastGain: 0,
            advanceToken: prev.advanceToken + 1,
            lastNote: 'Vaqt tugadi.',
          }
        })
        settleRound("Ikkala jamoada ham vaqt tugadi. Keyingi savol ochiladi.")
        return
      }

      if (!leftTeam.finished && !leftTeam.locked) {
        if (leftTeam.timeLeft <= 1) {
          registerTimeout('left')
        } else {
          setLeftTeam((prev) =>
            prev.finished || prev.locked ? prev : { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) },
          )
        }
      }

      if (!rightTeam.finished && !rightTeam.locked) {
        if (rightTeam.timeLeft <= 1) {
          registerTimeout('right')
        } else {
          setRightTeam((prev) =>
            prev.finished || prev.locked ? prev : { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) },
          )
        }
      }
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [
    leftTasks,
    leftTeam,
    matchFinished,
    settleRound,
    registerTimeout,
    rightTasks,
    rightTeam,
    started,
  ])

  useEffect(() => {
    if (!started || matchFinished || roundAdvanceToken === 0 || !isRoundSettled) return

    const timer = window.setTimeout(() => {
      advanceRound()
    }, config.autoNextMs)

    return () => window.clearTimeout(timer)
  }, [advanceRound, config.autoNextMs, isRoundSettled, matchFinished, roundAdvanceToken, started])

  const roundResolved = isRoundSettled || matchFinished
  const leftSolved = Math.min(
    leftTasks.length,
    leftTeam.index + (leftTeam.finished || roundResolved ? 1 : 0),
  )
  const rightSolved = Math.min(
    rightTasks.length,
    rightTeam.index + (rightTeam.finished || roundResolved ? 1 : 0),
  )
  const leftProgress = leftTasks.length > 0 ? Math.round((leftSolved / leftTasks.length) * 100) : 0
  const rightProgress = rightTasks.length > 0 ? Math.round((rightSolved / rightTasks.length) * 100) : 0

  const winnerName = winner === 'left' ? leftLabel : winner === 'right' ? rightLabel : ''

  const winnerTeam = useMemo(() => {
    if (winner === 'left') return leftTeam
    if (winner === 'right') return rightTeam
    return null
  }, [winner, leftTeam, rightTeam])

  const renderTeamPanel = (
    side: Side,
    label: string,
    team: TeamProgress,
    tasks: KvestTask[],
    accentClass: string,
    borderClass: string,
  ) => {
    const task = tasks[team.index]
    const canInteract = started && !matchFinished && !team.finished && !team.locked && Boolean(task)

    return (
      <article className={`arena-3d-panel rounded-[1.7rem] border p-4 shadow-soft sm:p-5 ${borderClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-kid text-4xl text-slate-900 sm:text-5xl">{label}</h3>
          <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-white ${accentClass}`}>
            {team.score} ball
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center">
            Savol
            <p className="mt-1 text-lg font-black text-slate-800">
              {tasks.length === 0 ? '0/0' : `${Math.min(team.index + 1, tasks.length)}/${tasks.length}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center">
            Vaqt
            <p className={`mt-1 text-lg font-black ${team.timeLeft <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>
              {team.finished ? '-' : `${team.timeLeft}s`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center">
            To'g'ri
            <p className="mt-1 text-lg font-black text-slate-800">{team.correct}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center">
            Combo
            <p className="mt-1 text-lg font-black text-slate-800">{team.bestStreak}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            <span>Jamoa progress</span>
            <span>{tasks.length === 0 ? 0 : Math.round(((team.index + (team.finished ? 1 : 0)) / tasks.length) * 100)}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accentClass}`}
              style={{ width: `${side === 'left' ? leftProgress : rightProgress}%` }}
            />
          </div>
        </div>

        {!started ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-base font-bold text-slate-600">Boshlash tugmasi bosilgach shu jamoaga umumiy deckdagi savol chiqadi.</p>
          </div>
        ) : null}

        {started && team.finished ? (
          <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">Yakunladi</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-800">Barcha savollar tugadi</p>
          </div>
        ) : null}

        {started && !team.finished && task ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Savol matni</p>
              <p className="mt-1 font-kid text-3xl leading-tight text-slate-900 sm:text-4xl">{task.prompt}</p>
            </div>
            {task.type === 'choice' ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {task.options.map((option, index) => {
                  const isCorrect = index === task.correctIndex
                  const isSelected = team.selectedChoice === index
                  const visualKind = task.optionVisuals?.[index] ?? null
                  const visualThemes = [
                    'from-cyan-400 via-sky-400 to-blue-500',
                    'from-fuchsia-400 via-pink-400 to-rose-500',
                    'from-amber-300 via-orange-400 to-orange-500',
                    'from-emerald-400 via-teal-400 to-cyan-500',
                  ] as const
                  const letter = String.fromCharCode(65 + index)

                  const toneClass = !team.locked
                    ? 'border-slate-200 bg-white text-slate-700 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-soft'
                    : isCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[0_12px_35px_rgba(16,185,129,0.14)]'
                      : isSelected
                        ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-[0_12px_35px_rgba(244,63,94,0.12)]'
                        : 'border-slate-200 bg-slate-100 text-slate-500'

                  return (
                    <button
                      key={`${task.id}-${index}`}
                      type="button"
                      onClick={() => handleChoice(side, index)}
                      disabled={!canInteract}
                      className={`arena-3d-press group overflow-hidden rounded-2xl border text-left transition ${toneClass} ${
                        !canInteract ? 'cursor-not-allowed opacity-85' : ''
                      }`}
                    >
                      <div className={`relative h-14 w-full bg-gradient-to-r ${visualThemes[index % visualThemes.length]}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.35),transparent_46%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.16),transparent_40%)]" />
                        <div className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/50 bg-white/20 text-base font-black text-white shadow">
                          {letter}
                        </div>
                        <div className="absolute bottom-2 right-3 rounded-full border border-white/45 bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
                          Variant
                        </div>
                      </div>

                      <div className="flex items-start gap-3 px-3 py-3">
                        {visualKind ? (
                          <OptionShapeVisual kind={visualKind} accentClass={visualThemes[index % visualThemes.length]} />
                        ) : (
                          <MiniObjectVisual
                            option={option}
                            prompt={task.prompt}
                            accentClass={visualThemes[index % visualThemes.length]}
                            letter={letter}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Javob</p>
                          <p className="mt-0.5 text-base font-extrabold leading-snug">{option}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input
                  value={team.inputValue}
                  onChange={(event) => handleInputChange(side, event.target.value)}
                  onKeyDown={(event) => handleInputEnter(side, event)}
                  disabled={!canInteract}
                  inputMode={task.inputKind === 'number' ? 'numeric' : 'text'}
                  placeholder={task.placeholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg font-extrabold text-slate-800 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => submitInput(side)}
                  disabled={!canInteract}
                  className={`arena-3d-press mt-2.5 rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition ${accentClass} ${
                    !canInteract ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5'
                  }`}
                >
                  Tasdiqlash
                </button>
              </div>
            )}

            {team.locked && !team.finished ? (
              <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-extrabold text-cyan-700">
                {isRoundSettled ? 'Keyingi savol avtomatik ochiladi...' : 'Javob berildi. Raqib javobi kutilmoqda...'}
              </p>
            ) : null}
          </div>
        ) : null}

        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-sm font-extrabold ${
            team.status === 'correct'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : team.status === 'wrong'
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : team.status === 'timeout'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : team.status === 'done'
                    ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                    : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {team.lastNote}
        </p>
      </article>
    )
  }

  return (
    <section className="glass-card arena-3d-shell relative p-4 sm:p-6" data-aos="fade-up" data-aos-delay="80">
      <div className="pointer-events-none absolute -left-20 top-14 h-52 w-52 rounded-full bg-cyan-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-52 w-52 rounded-full bg-fuchsia-200/35 blur-3xl" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-700">
            Race duel mode
          </p>
          <h2 className="mt-2 font-kid text-4xl text-slate-900 sm:text-5xl">{gameTitle}</h2>
          <p className="mt-1 text-base font-bold text-slate-600">
            Ikkala jamoaga bir xil savol chiqadi. Kim tez va to'g'ri topsa shu raund balini oladi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={setupPath}
            className="arena-3d-press rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:-translate-y-0.5"
          >
            {'< '}Orqaga
          </Link>
          <button
            type="button"
            onClick={startMatch}
            className={`arena-3d-press rounded-xl bg-gradient-to-r px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
          >
            {started ? "Qayta boshlash" : "O'yinni boshlash"}
          </button>
          <button
            type="button"
            onClick={resetMatch}
            className="arena-3d-press ui-secondary-btn ui-secondary-btn--sm px-4 py-2.5"
          >
            Tozalash
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Daraja</p>
          <p className="mt-1 text-xl font-extrabold text-slate-800">{initialDifficulty}</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Savollar</p>
          <p className="mt-1 text-xl font-extrabold text-slate-800">{config.questionCount} ta umumiy raund</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Timer</p>
          <p className="mt-1 text-xl font-extrabold text-slate-800">{config.secondsPerQuestion}s</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{leftLabel}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-800">{leftTeam.score} ball</p>
        </div>
        <div className="arena-3d-card rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{rightLabel}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-800">{rightTeam.score} ball</p>
        </div>
      </div>

      <div className="arena-3d-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
          <span>Umumiy holat</span>
          <span>{matchFinished ? 'Yakunlandi' : started ? 'Jarayonda' : 'Tayyor'}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gameTone}`}
            style={{
              width: `${Math.max(leftProgress, rightProgress)}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {renderTeamPanel('left', leftLabel, leftTeam, leftTasks, 'from-cyan-500 to-blue-500', 'border-cyan-200 bg-cyan-50/35')}
        {renderTeamPanel('right', rightLabel, rightTeam, rightTasks, 'from-fuchsia-500 to-rose-500', 'border-fuchsia-200 bg-fuchsia-50/35')}
      </div>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
          matchFinished ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
        }`}
      >
        {statusText}
      </div>

      {showWinnerModal && winnerTeam ? (
        <div className="fixed inset-0 z-[98] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <ConfettiOverlay burstKey={confettiBurst} />
          <div className="relative z-[2] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="pointer-events-none absolute -left-14 -top-16 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-fuchsia-200/35 blur-3xl" />

            <div className="relative">
              <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                Topqirlik kvesti yakunlandi
              </p>
              <h3 className="mt-3 font-kid text-5xl leading-tight text-slate-900">G'olib: {winnerName}</h3>
              <p className="mt-1 text-base font-bold text-slate-600">
                Eng ko'p ball to'plagan jamoa.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Ball</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">{winnerTeam.score}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">To'g'ri javob</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">{winnerTeam.correct}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">Best combo</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">{winnerTeam.bestStreak}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{leftLabel}</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-800">{leftTeam.score} ball</p>
                  <p className="text-sm font-bold text-slate-500">{leftTeam.correct} ta to'g'ri</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">{rightLabel}</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-800">{rightTeam.score} ball</p>
                  <p className="text-sm font-bold text-slate-500">{rightTeam.correct} ta to'g'ri</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={startMatch}
                  className={`rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 ${gameTone}`}
                >
                  Yana o'ynash
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default TopqirlikKvestArena
