import type {
  FakeOrFactCategory,
  FakeOrFactDifficulty,
  FakeOrFactQuestion,
  FakeOrFactSetupConfig,
} from './types.ts'

type TemplateEntry = {
  factText: string
  fakeText: string
  factExplanation: string
  fakeExplanation: string
}

const pointMap: Record<FakeOrFactDifficulty, number> = {
  easy: 100,
  medium: 160,
  hard: 240,
}

const templateBank: Record<FakeOrFactCategory, Record<FakeOrFactDifficulty, TemplateEntry[]>> = {
  fan: {
    easy: [
      {
        factText: "O'simliklar quyosh nuri yordamida fotosintez qiladi.",
        fakeText: "O'simliklar faqat tunda kislorod ishlab chiqaradi.",
        factExplanation: "Fotosintez yorug'lik ishtirokida sodir bo'ladi va o'simlik energiya hosil qiladi.",
        fakeExplanation: "O'simliklar doimiy ravishda nafas oladi, lekin fotosintez asosan yorug'likda kuchli bo'ladi.",
      },
      {
        factText: "Yer Quyosh atrofida aylanadi.",
        fakeText: "Quyosh Yer atrofida bir yilda bir marta aylanadi.",
        factExplanation: "Yer Quyosh atrofida taxminan 365 kunda bir marta aylanadi.",
        fakeExplanation: "Kundalik ko'rinish shunday tuyuladi, lekin haqiqiy harakat aksincha.",
      },
      {
        factText: "Muz qizdirilganda eriydi.",
        fakeText: "Muz qizdirilganda yanada qattiqlashadi.",
        factExplanation: "Harorat oshsa, muz suyuq holatga o'ta boshlaydi.",
        fakeExplanation: "Qizdirish qattiqlashtirmaydi, aksincha eritadi.",
      },
      {
        factText: "Inson nafas olish uchun kislorodga muhtoj.",
        fakeText: "Inson tanasi havosiz bir necha kun bemalol yashay oladi.",
        factExplanation: "Kislorod organizm hujayralari uchun zarur hisoblanadi.",
        fakeExplanation: "Havosiz uzoq yashab bo'lmaydi, kislorod hayot uchun kerak.",
      },
      {
        factText: "Oy Yerning tabiiy yo'ldoshi hisoblanadi.",
        fakeText: "Oy Quyoshdan ham issiqroq sayyora hisoblanadi.",
        factExplanation: "Oy Yer atrofida aylanadigan tabiiy osmon jismidir.",
        fakeExplanation: "Oy sayyora emas va Quyoshdan issiqroq ham emas.",
      },
    ],
    medium: [
      {
        factText: "Inson tanasidagi eng katta a'zo bu teridir.",
        fakeText: "Inson tanasidagi eng katta a'zo yurak hisoblanadi.",
        factExplanation: "Teri butun tanani qoplaydi va maydoni eng katta a'zo hisoblanadi.",
        fakeExplanation: "Yurak muhim a'zo, lekin maydoni va og'irligi bo'yicha eng kattasi emas.",
      },
      {
        factText: "DNA organizm haqidagi irsiy ma'lumotni saqlaydi.",
        fakeText: "DNA faqat qon guruhini saqlaydi, boshqa ma'lumotni emas.",
        factExplanation: "Irsiy belgilarning katta qismi DNA orqali kodlanadi.",
        fakeExplanation: "DNA juda ko'p biologik ko'rsatmalarni saqlaydi, faqat bitta xususiyatni emas.",
      },
    ],
    hard: [
      {
        factText: "Vaksinalar immun tizimga xavfsiz tayyorgarlik beradi.",
        fakeText: "Vaksinalar immun tizimni butunlay o'chirib qo'yadi.",
        factExplanation: "Vaksina immun tizimga antitanalarni tayyorlashga yordam beradi.",
        fakeExplanation: "Vaksinalar himoya tizimini yo'q qilmaydi, aksincha uni mashq qildiradi.",
      },
      {
        factText: "Pluton 2006-yildan boshlab mitti sayyora sifatida tasniflanadi.",
        fakeText: "Pluton hanuz Quyosh tizimidagi eng katta sayyora hisoblanadi.",
        factExplanation: "Xalqaro astronomiya ittifoqi Plutonni mitti sayyora deb qayta tasnifladi.",
        fakeExplanation: "Pluton na eng katta, na hozir rasmiy sayyora toifasida turadi.",
      },
    ],
  },
  tarix: {
    easy: [
      {
        factText: "Amir Temur Samarqandni yirik markazga aylantirgan.",
        fakeText: "Amir Temur poytaxt sifatida faqat Xivani tanlagan.",
        factExplanation: "Samarqand Temur davrida siyosiy va madaniy markaz bo'lgan.",
        fakeExplanation: "Temuriylar davrida asosiy markaz Samarqand edi.",
      },
      {
        factText: "Qadimgi Misrda piramidalar qurilgan.",
        fakeText: "Qadimgi Misrda osmono'par shisha binolar qurilgan.",
        factExplanation: "Misr piramidalari tarixdagi eng mashhur me'moriy obidalardan biridir.",
        fakeExplanation: "Shisha osmono'par binolar zamonaviy davrga tegishli.",
      },
      {
        factText: "Mirzo Ulug'bek Samarqandda mashhur rasadxona qurgan.",
        fakeText: "Mirzo Ulug'bek tarixda faqat rassom sifatida tanilgan.",
        factExplanation: "Ulug'bek astronomiya va rasadxona ishlari bilan juda mashhur.",
        fakeExplanation: "U asosan olim va hukmdor sifatida tanilgan.",
      },
      {
        factText: "Ipak yo'li qadimda savdo va madaniyat almashinuviga xizmat qilgan.",
        fakeText: "Ipak yo'li faqat suv ostidan o'tgan maxfiy tunnel bo'lgan.",
        factExplanation: "Ipak yo'li turli hududlarni bog'lab, savdoni kuchaytirgan.",
        fakeExplanation: "U tunnel emas, ko'plab yo'llardan iborat tarixiy tarmoq bo'lgan.",
      },
      {
        factText: "Buyuk Xitoy devori Xitoy hududida qurilgan.",
        fakeText: "Buyuk Xitoy devori O'zbekistonda qurilgan tarixiy inshootdir.",
        factExplanation: "Nomidan ham ko'rinib turibdi, bu devor Xitoy tarixiga tegishli.",
        fakeExplanation: "Bu inshoot O'zbekistonda emas, Xitoyda joylashgan.",
      },
    ],
    medium: [
      {
        factText: "Ipak yo'li Sharq va G'arbni bog'lagan savdo yo'li bo'lgan.",
        fakeText: "Ipak yo'li faqat bitta davlat ichidagi ichki yo'l bo'lgan.",
        factExplanation: "Bu yo'l ko'plab hududlar o'rtasidagi savdo va madaniy almashinuvni kuchaytirgan.",
        fakeExplanation: "Ipak yo'li juda keng mintaqalararo tarmoq bo'lgan.",
      },
      {
        factText: "Mirzo Ulug'bek astronomiya bilan jiddiy shug'ullangan.",
        fakeText: "Mirzo Ulug'bek tarixda faqat dengizchi sifatida tanilgan.",
        factExplanation: "Ulug'bek rasadxonasi va yulduzlar jadvali bilan mashhur.",
        fakeExplanation: "U dengizchi emas, olim va hukmdor sifatida tanilgan.",
      },
    ],
    hard: [
      {
        factText: "Bosma dastgohning ommalashuvi bilim tarqalishini tezlashtirgan.",
        fakeText: "Bosma dastgoh sabab kitoblar yanada kamroq odamga yetib borgan.",
        factExplanation: "Bosma dastgoh kitoblarni ko'proq nusxada tayyorlash imkonini berdi.",
        fakeExplanation: "Aksincha, bilim va matnlar tezroq tarqala boshladi.",
      },
      {
        factText: "Ikkinchi jahon urushi 1939-yilda boshlangan.",
        fakeText: "Ikkinchi jahon urushi 1914-yilda boshlangan.",
        factExplanation: "1914-yil Birinchi jahon urushining boshlanish yili hisoblanadi.",
        fakeExplanation: "Bu sana boshqa urushga tegishli.",
      },
    ],
  },
  texnologiya: {
    easy: [
      {
        factText: "Kompyuter ma'lumotni qayta ishlash uchun dasturdan foydalanadi.",
        fakeText: "Kompyuter internet bo'lmasa umuman ishlamaydi.",
        factExplanation: "Ko'p dasturlar internet bo'lmasa ham ishlashi mumkin.",
        fakeExplanation: "Internet foydali, lekin kompyuterning asosiy ishlashi unga bog'liq emas.",
      },
      {
        factText: "Klaviatura matn kiritish qurilmasidir.",
        fakeText: "Klaviatura ovozni printerga aylantirib beradi.",
        factExplanation: "Klaviatura orqali harf va buyruqlar kiritiladi.",
        fakeExplanation: "Bu uning vazifasi emas.",
      },
      {
        factText: "QR kodni telefon kamerasi bilan skanerlash mumkin.",
        fakeText: "QR kodni faqat televizor pulti bilan ochish mumkin.",
        factExplanation: "Ko'p telefonlarda kamera yoki ilova orqali QR kod o'qiladi.",
        fakeExplanation: "QR kodni pult emas, kamera yoki maxsus ilova o'qiydi.",
      },
      {
        factText: "Parolni boshqalar bilan ulashmaslik xavfsizlik uchun muhim.",
        fakeText: "Parolni do'stlar bilan tarqatish akkauntni xavfsizroq qiladi.",
        factExplanation: "Parol sir bo'lsa, akkaunt yaxshiroq himoyalanadi.",
        fakeExplanation: "Parolni ulashish xavfni oshiradi, kamaytirmaydi.",
      },
      {
        factText: "Telefon batareyasi tugasa, qurilma o'chadi.",
        fakeText: "Telefon zaryadsiz holatda ham bir hafta ishlab turadi.",
        factExplanation: "Batareya quvvati tugasa, qurilma ishlay olmaydi.",
        fakeExplanation: "Quvvat bo'lmasa, telefon uzoq ishlamaydi.",
      },
    ],
    medium: [
      {
        factText: "Sun'iy intellekt ma'lumotlar asosida naqshlarni topa oladi.",
        fakeText: "Sun'iy intellekt xato qilmaydi va doim 100 foiz to'g'ri ishlaydi.",
        factExplanation: "AI foydali, lekin u ham noto'g'ri natija berishi mumkin.",
        fakeExplanation: "AI tizimlari mukammal emas va doim tekshiruv talab qiladi.",
      },
      {
        factText: "Bulutli saqlash ma'lumotni uzoq serverlarda saqlashi mumkin.",
        fakeText: "Bulutli saqlash degani fayllar faqat telefon ichida qoladi.",
        factExplanation: "Cloud xizmati ma'lumotni masofadagi serverlarda ushlab turadi.",
        fakeExplanation: "Bulutli saqlash mahalliy xotiradan farq qiladi.",
      },
    ],
    hard: [
      {
        factText: "Ikki bosqichli tasdiqlash akkaunt xavfsizligini kuchaytiradi.",
        fakeText: "Ikki bosqichli tasdiqlash parolni keraksiz qilib qo'yadi.",
        factExplanation: "2FA parolga qo'shimcha himoya qatlamini beradi.",
        fakeExplanation: "Parol baribir kerak bo'ladi, 2FA esa qo'shimcha bosqich hisoblanadi.",
      },
      {
        factText: "Algoritm buyruqlarning tartibli ketma-ketligi hisoblanadi.",
        fakeText: "Algoritm faqat robotlar uchun ishlatiladi, oddiy dasturlarda emas.",
        factExplanation: "Har qanday dastur ichida algoritmik mantiq bo'ladi.",
        fakeExplanation: "Algoritm faqat robototexnikaga xos tushuncha emas.",
      },
    ],
  },
  internet: {
    easy: [
      {
        factText: "Internetdagi har bir xabarni tekshirmasdan ulashish xavfli bo'lishi mumkin.",
        fakeText: "Internetda yozilgan hamma narsa avtomatik ravishda to'g'ri bo'ladi.",
        factExplanation: "Onlayn ma'lumotlarni ishonchli manba bilan tekshirish kerak.",
        fakeExplanation: "Internetda xato va yolg'on ma'lumotlar ham ko'p uchraydi.",
      },
      {
        factText: "Soxta sarlavha odamni tez bosishga majbur qilishi mumkin.",
        fakeText: "Clickbait sarlavhalar faqat ilmiy maqolalarda ishlatiladi.",
        factExplanation: "Clickbait odatda e'tiborni tortish uchun ishlatiladi.",
        fakeExplanation: "Bu ko'proq ijtimoiy tarmoqlar va saytlarda uchraydi.",
      },
      {
        factText: "Eski video yangi voqea deb tarqatilishi mumkin.",
        fakeText: "Internetdagi har bir video albatta bugungi kunda suratga olingan bo'ladi.",
        factExplanation: "Ba'zan eski material yangi voqea sifatida qayta ulashiladi.",
        fakeExplanation: "Videoning qachon olinganini alohida tekshirish kerak bo'ladi.",
      },
      {
        factText: "Tasdiq belgisi bo'lgan akkaunt ham xato ma'lumot ulashishi mumkin.",
        fakeText: "Tasdiq belgisi bor akkaunt hech qachon adashmaydi.",
        factExplanation: "Belgili akkaunt ham inson yoki tashkilot bo'lgani uchun xato qilishi mumkin.",
        fakeExplanation: "Belgi ishonchlilikni oshiradi, lekin xatosiz degani emas.",
      },
      {
        factText: "Bir xil rasm turli yolg'on izohlar bilan tarqatilishi mumkin.",
        fakeText: "Rasmga yozilgan izoh avtomatik ravishda doim haqiqat bo'ladi.",
        factExplanation: "Rasmning o'zi ham noto'g'ri kontekst bilan berilishi mumkin.",
        fakeExplanation: "Izohni ham alohida tekshirmasdan ishonib bo'lmaydi.",
      },
    ],
    medium: [
      {
        factText: "Bot akkauntlar ba'zan haqiqiy foydalanuvchi kabi ko'rinadi.",
        fakeText: "Bot akkauntlarni internetda umuman yasab bo'lmaydi.",
        factExplanation: "Ayrim botlar odamga o'xshab yozishi va post ulashishi mumkin.",
        fakeExplanation: "Botlar mavjud va ularni aniqlash uchun ehtiyotkorlik kerak.",
      },
      {
        factText: "Manba ko'rsatilmagan statistikaga shubha bilan qarash kerak.",
        fakeText: "Raqam bilan yozilgan har qanday post ishonchli bo'ladi.",
        factExplanation: "Raqamlar ham noto'g'ri yoki manipulyativ ishlatilishi mumkin.",
        fakeExplanation: "Statistika manbasi va metodini tekshirish zarur.",
      },
    ],
    hard: [
      {
        factText: "Deepfake video haqiqiydek ko'rinsa ham montaj bo'lishi mumkin.",
        fakeText: "Deepfake texnologiyasi faqat multfilm yaratishda ishlatiladi.",
        factExplanation: "Deepfake odam yuzini va ovozini sun'iy tarzda almashtirishi mumkin.",
        fakeExplanation: "Bu texnologiya media savodxonlik uchun jiddiy sinov yaratadi.",
      },
      {
        factText: "Echo chamber bir xil fikrlar ichida qolib ketishga olib kelishi mumkin.",
        fakeText: "Echo chamber foydalanuvchini doim turli qarashlar bilan tanishtiradi.",
        factExplanation: "Algoritmlar ba'zan bir xil qarashlarni ko'proq ko'rsatadi.",
        fakeExplanation: "Aksincha, turli nuqtai nazar kamayib ketishi mumkin.",
      },
    ],
  },
  qiziqarli: {
    easy: [
      {
        factText: "Agar bugun dushanba bo'lsa, ertaga seshanba bo'ladi.",
        fakeText: "Agar bugun dushanba bo'lsa, ertaga yakshanba bo'ladi.",
        factExplanation: "Hafta kunlari tartibiga ko'ra dushanbadan keyin seshanba keladi.",
        fakeExplanation: "Dushanbadan keyin yakshanba emas, seshanba keladi.",
      },
      {
        factText: "Barcha kvadratlar to'rtburchak hisoblanadi.",
        fakeText: "Har bir to'rtburchak albatta kvadrat bo'ladi.",
        factExplanation: "Kvadrat to'rtburchaklarning maxsus ko'rinishi hisoblanadi.",
        fakeExplanation: "Har bir to'rtburchakning barcha tomonlari teng bo'lmaydi, shuning uchun hammasi kvadrat emas.",
      },
      {
        factText: "Bir xil ma'lumot ikki joyda yozilgan bo'lsa ham, uni tekshirish foydali.",
        fakeText: "Bir xil gap ikki joyda yozilsa, u avtomatik ravishda haqiqat bo'ladi.",
        factExplanation: "Bir xabar ko'chirib tarqatilgan bo'lishi mumkin, manbani tekshirish baribir muhim.",
        fakeExplanation: "Bir necha joyda ko'rinish ma'lumotni avtomatik haqiqatga aylantirmaydi.",
      },
      {
        factText: "Uchburchakning ichki burchaklari yig'indisi 180 daraja bo'ladi.",
        fakeText: "Uchburchakning ichki burchaklari yig'indisi 300 daraja bo'ladi.",
        factExplanation: "Tekislikdagi oddiy uchburchakda ichki burchaklar yig'indisi 180 daraja bo'ladi.",
        fakeExplanation: "300 daraja uchburchak uchun to'g'ri emas.",
      },
      {
        factText: "10 dan 4 ayirilsa, 6 qoladi.",
        fakeText: "10 dan 4 ayirilsa, 14 chiqadi.",
        factExplanation: "Oddiy ayirishda 10 - 4 = 6 bo'ladi.",
        fakeExplanation: "Ayirish natijasi 14 emas, 6 bo'ladi.",
      },
    ],
    medium: [
      {
        factText: "Agar barcha A lar B bo'lsa va barcha B lar C bo'lsa, barcha A lar ham C bo'ladi.",
        fakeText: "Agar barcha A lar B bo'lsa, demak barcha B lar ham A bo'ladi.",
        factExplanation: "Bu mantiqiy zanjirda A toifasi B va C ichida qoladi.",
        fakeExplanation: "Bir tomonga tegishlilik har doim teskari tomonga ham ishlamaydi.",
      },
      {
        factText: "Ma'lumot yetarli bo'lmasa, aniq xulosa chiqarishga shoshilmaslik kerak.",
        fakeText: "Yarim ma'lumot ham doim to'liq qaror chiqarish uchun yetarli bo'ladi.",
        factExplanation: "To'liq xulosa uchun dalil va ma'lumot yetarli bo'lishi kerak.",
        fakeExplanation: "Yarim ma'lumotga tayanib qilingan xulosa ko'pincha noto'g'ri bo'lishi mumkin.",
      },
      {
        factText: "Son 2 ga ham, 3 ga ham bo'linsa, u 6 ga ham bo'linadi.",
        fakeText: "Son 2 ga bo'linsa, u albatta 3 ga ham bo'linadi.",
        factExplanation: "2 va 3 ga bo'linadigan son 6 ga ham bo'linadi.",
        fakeExplanation: "2 ga bo'linishning o'zi 3 ga bo'linishni anglatmaydi.",
      },
      {
        factText: "Grafik o'sayotgandek ko'rinsa ham, o'q masshtabi natijani bo'rttirishi mumkin.",
        fakeText: "Har qanday grafik bir qarashda ko'ringani kabi mutlaqo xolis bo'ladi.",
        factExplanation: "Grafikdagi masshtab va kesmalar natijani kattaroq yoki kichikroq ko'rsatishi mumkin.",
        fakeExplanation: "Grafikni tushunishda o'qlar va birliklarni albatta tekshirish kerak.",
      },
    ],
    hard: [
      {
        factText: "Ikki hodisa bir vaqtda sodir bo'lishi ularning biri albatta boshqasiga sabab bo'lganini bildirmaydi.",
        fakeText: "Agar ikki hodisa bir paytda ko'paysa, biri albatta ikkinchisining sababi bo'ladi.",
        factExplanation: "Birga uchrashish va sabab-oqibat har doim bir narsa emas.",
        fakeExplanation: "Korrelyatsiya har doim sabab-oqibat degani emas.",
      },
      {
        factText: "Bitta misol butun guruh haqida yakuniy hukm chiqarish uchun yetarli emas.",
        fakeText: "Bitta odamdagi holatni ko'rib, butun guruh haqida aniq xulosa chiqarish mumkin.",
        factExplanation: "Yaxshi xulosa uchun ko'proq misol va kengroq ma'lumot kerak bo'ladi.",
        fakeExplanation: "Bitta misol umumiy qonuniyatni isbotlamaydi.",
      },
      {
        factText: "Savolda yashirin taxmin bo'lsa, javob berishdan oldin o'sha taxminni tekshirish kerak.",
        fakeText: "Savoldagi yashirin taxminlarni tekshirishning hojati yo'q, darhol xulosa qilish kerak.",
        factExplanation: "Ba'zan savolning o'zi noto'g'ri taxminga qurilgan bo'lishi mumkin.",
        fakeExplanation: "Yashirin taxminni tekshirmaslik noto'g'ri javobga olib kelishi mumkin.",
      },
      {
        factText: "Kuchli his-tuyg'u uyg'otadigan gap ham dalilsiz bo'lsa, ehtiyotkor tekshirilishi kerak.",
        fakeText: "Agar gap juda ta'sirli bo'lsa, u dalilsiz ham to'g'ri hisoblanadi.",
        factExplanation: "Hissiy ta'sir haqiqatni kafolatlamaydi, dalil baribir kerak bo'ladi.",
        fakeExplanation: "Ta'sirli uslub ma'lumotni avtomatik ishonchli qilmaydi.",
      },
    ],
  },
}

const categoryOrder: FakeOrFactCategory[] = ['qiziqarli', 'fan', 'internet', 'texnologiya', 'tarix']

const seededShuffle = <T,>(items: T[], seed: number) => {
  const next = [...items]
  let localSeed = seed
  for (let index = next.length - 1; index > 0; index -= 1) {
    localSeed = (localSeed * 9301 + 49297) % 233280
    const swapIndex = Math.floor((localSeed / 233280) * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }
  return next
}

const buildBalancedDeck = (
  pool: FakeOrFactQuestion[],
  roundCount: number,
  seed: number,
  categories: FakeOrFactCategory[],
) => {
  const buckets = categories.map((category, index) => ({
    category,
    items: seededShuffle(
      pool.filter((question) => question.category === category),
      seed + (index + 1) * 101,
    ),
  }))

  const deck: FakeOrFactQuestion[] = []
  while (deck.length < roundCount) {
    let addedAny = false

    buckets.forEach((bucket) => {
      if (deck.length >= roundCount) return
      const nextQuestion = bucket.items.shift()
      if (!nextQuestion) return
      deck.push(nextQuestion)
      addedAny = true
    })

    if (!addedAny) break
  }

  return deck
}

const generateSyntheticQuestions = (
  category: FakeOrFactCategory,
  difficulty: FakeOrFactDifficulty,
  count: number,
) => {
  const entries = templateBank[category][difficulty]
  return Array.from({ length: count }, (_unused, index) => {
    const entry = entries[index % entries.length]
    const isFact = index % 2 === 0
    return {
      id: `generated-${category}-${difficulty}-${index}-${isFact ? 'fact' : 'fake'}`,
      category,
      difficulty,
      text_uz: isFact ? entry.factText : entry.fakeText,
      answer: isFact,
      explanation_uz: isFact ? entry.factExplanation : entry.fakeExplanation,
      points: pointMap[difficulty],
      source: 'generated' as const,
    }
  })
}

const createGeneratedPool = (roundCount: number) => {
  const generated: FakeOrFactQuestion[] = []
  categoryOrder.forEach((category) => {
    ;(['easy', 'medium', 'hard'] as FakeOrFactDifficulty[]).forEach((difficulty) => {
      generated.push(...generateSyntheticQuestions(category, difficulty, Math.max(4, roundCount)))
    })
  })
  return generated
}

export const categoryLabelMap: Record<FakeOrFactCategory | 'mix', string> = {
  mix: 'Aralash',
  fan: 'Fan',
  tarix: 'Tarix',
  texnologiya: 'Texnologiya',
  internet: 'Internet faktlari',
  qiziqarli: 'Mantiq va topqirlik',
}

export const modeLabelMap = {
  class: 'Navbatma-navbat',
  speed: 'Tezkor duel',
} as const

export const buildFakeOrFactDeck = (config: FakeOrFactSetupConfig) => {
  const basePool = [...config.customQuestions, ...createGeneratedPool(config.roundCount * 2)]
  const filteredByCategory = config.category === 'mix'
    ? basePool
    : basePool.filter((question) => question.category === config.category)

  const filteredByDifficulty = filteredByCategory.filter((question) => {
    if (config.startingDifficulty === 'easy') return question.difficulty === 'easy'
    if (config.startingDifficulty === 'medium') return question.difficulty !== 'hard'
    return true
  })

  const candidatePool = filteredByDifficulty.length > 0 ? filteredByDifficulty : basePool
  const seed = config.roundCount * 17 + config.roomName.length
  const deck = config.category === 'mix'
    ? buildBalancedDeck(candidatePool, config.roundCount, seed, categoryOrder)
    : seededShuffle(candidatePool, seed).slice(0, config.roundCount)

  const fallbackDeck = config.category === 'mix'
    ? buildBalancedDeck(basePool, config.roundCount, seed + 37, categoryOrder)
    : seededShuffle(basePool, seed + 37).slice(0, config.roundCount)

  return deck.length >= config.roundCount
    ? deck
    : [
        ...deck,
        ...fallbackDeck.filter((question) => !deck.some((item) => item.id === question.id)),
        ...createGeneratedPool(config.roundCount),
      ].slice(0, config.roundCount)
}
