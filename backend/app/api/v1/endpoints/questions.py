import uuid
import json
import random
import re
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.enums import QuestionType, UserRole
from app.models.game import Game
from app.models.question import Question
from app.models.user import User
from app.schemas.question import (
    AIQuestionItem,
    AIQuestionGenerateRequest,
    AIQuestionGenerateResponse,
    QuestionCreate,
    QuestionRead,
    QuestionUpdate,
)

router = APIRouter(prefix="/questions", tags=["questions"])


def _can_manage_question(current_user: User, question: Question) -> bool:
    return current_user.role == UserRole.ADMIN or question.teacher_id == current_user.id


def _validate_question(
    *,
    question_type: QuestionType,
    options: list[str],
    correct_index: int | None,
    answer_text: str | None,
) -> None:
    if question_type == QuestionType.MULTIPLE_CHOICE:
        if len(options) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Multiple-choice savol uchun kamida 2 ta variant kerak.",
            )
        if correct_index is None or correct_index < 0 or correct_index >= len(options):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="correct_index noto'g'ri.",
            )
    if question_type == QuestionType.OPEN_TEXT:
        if not answer_text or not answer_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Open-text savol uchun answer_text majburiy.",
            )


_GAME_PROMPT_HINTS: dict[str, str] = {
    "box-jang": "Matematik amalli savol tuzing.",
    "car-racing-math": "Tez hisoblashga mos matematik savol bo'lsin.",
    "tezkor-hisob": "Qisqa, aniq va tez yechiladigan misol bo'lsin.",
    "arqon-tortish": "Arifmetik savol va sonli javob variantlari bering.",
    "millioner": "Bilimga oid test savoli bo'lsin.",
    "inglizcha-soz": "Inglizcha so'z va tarjima mavzusida test bo'lsin.",
    "jumla-ustasi": "Til va grammatika mavzusida savol bo'lsin.",
    "jumanji": "Qiziqarli umumiy bilim savoli bo'lsin.",
    "topqirlik-kvest": "Mantiqiy va topqirlik talab qiladigan savol bo'lsin.",
}

_FACTUAL_QUESTION_BANK: list[dict[str, Any]] = [
    {
        "tags": ("tarix", "history", "uzbekiston", "mustaqillik"),
        "question": "O'zbekiston mustaqilligi qaysi sana e'lon qilingan?",
        "options": ["1-sentyabr 1991", "8-dekabr 1992", "31-avgust 1991", "9-may 1991"],
        "answer": "1-sentyabr 1991",
    },
    {
        "tags": ("tarix", "history", "bmt", "un"),
        "question": "BMT (United Nations) qaysi yilda tashkil etilgan?",
        "options": ["1945", "1919", "1950", "1939"],
        "answer": "1945",
    },
    {
        "tags": ("tarix", "history", "ikkinchi jahon"),
        "question": "Ikkinchi jahon urushi qaysi yilda tugagan?",
        "options": ["1945", "1942", "1939", "1951"],
        "answer": "1945",
    },
    {
        "tags": ("tarix", "history", "amir temur", "temur"),
        "question": "Amir Temur qaysi shaharda tug'ilgan?",
        "options": ["Kesh (Shahrisabz)", "Buxoro", "Xiva", "Qo'qon"],
        "answer": "Kesh (Shahrisabz)",
    },
    {
        "tags": ("tarix", "temuriylar", "history"),
        "question": "Temuriylar davrida qaysi shahar markaziy poytaxt sifatida mashhur bo'lgan?",
        "options": ["Samarqand", "Termiz", "Nukus", "Andijon"],
        "answer": "Samarqand",
    },
    {
        "tags": ("geografiya", "geography", "poytaxt"),
        "question": "O'zbekiston poytaxti qaysi shahar?",
        "options": ["Toshkent", "Samarqand", "Buxoro", "Urganch"],
        "answer": "Toshkent",
    },
    {
        "tags": ("geografiya", "geography", "japan", "poytaxt"),
        "question": "Yaponiya poytaxti qaysi shahar?",
        "options": ["Tokio", "Osaka", "Kyoto", "Nagoya"],
        "answer": "Tokio",
    },
    {
        "tags": ("geografiya", "geography", "okean"),
        "question": "Yer yuzidagi eng katta okean qaysi?",
        "options": ["Tinch okeani", "Atlantika okeani", "Hind okeani", "Shimoliy Muz okeani"],
        "answer": "Tinch okeani",
    },
    {
        "tags": ("geografiya", "geography", "materik"),
        "question": "Eng katta materik qaysi?",
        "options": ["Osiyo", "Afrika", "Yevropa", "Avstraliya"],
        "answer": "Osiyo",
    },
    {
        "tags": ("geografiya", "geography", "ekvator"),
        "question": "Ekvator chizig'i qaysi materikdan o'tadi?",
        "options": ["Afrika", "Yevropa", "Avstraliya", "Antarktida"],
        "answer": "Afrika",
    },
    {
        "tags": ("biologiya", "biology", "fotosintez"),
        "question": "Fotosintez asosan hujayraning qaysi qismida sodir bo'ladi?",
        "options": ["Xloroplast", "Yadro", "Mitoxondriya", "Ribosoma"],
        "answer": "Xloroplast",
    },
    {
        "tags": ("biologiya", "biology", "qon"),
        "question": "Qonga qizil rang beruvchi asosiy modda qaysi?",
        "options": ["Gemoglobin", "Insulin", "Keratin", "Melanin"],
        "answer": "Gemoglobin",
    },
    {
        "tags": ("biologiya", "biology", "organ"),
        "question": "Inson tanasidagi eng katta organ qaysi?",
        "options": ["Teri", "Yurak", "Jigar", "O'pka"],
        "answer": "Teri",
    },
    {
        "tags": ("biologiya", "biology", "dna"),
        "question": "Nasliy axborotni saqlovchi molekula qaysi?",
        "options": ["DNK", "ATP", "Glyukoza", "Xolesterin"],
        "answer": "DNK",
    },
    {
        "tags": ("fizika", "physics", "gravitatsiya"),
        "question": "Yer tortish tezlanishi taxminan nechaga teng?",
        "options": ["9.8 m/s^2", "4.9 m/s^2", "12 m/s^2", "1.6 m/s^2"],
        "answer": "9.8 m/s^2",
    },
    {
        "tags": ("fizika", "physics", "tok"),
        "question": "Elektr tok kuchining SI birligi qaysi?",
        "options": ["Amper", "Volt", "Om", "Vatt"],
        "answer": "Amper",
    },
    {
        "tags": ("fizika", "physics", "quvvat"),
        "question": "Quvvatning SI birligi qaysi?",
        "options": ["Vatt", "Joul", "Nyuton", "Paskal"],
        "answer": "Vatt",
    },
    {
        "tags": ("fizika", "physics", "yorug'lik"),
        "question": "Yorug'likning vakuumdagi tezligi taxminan qancha?",
        "options": ["300 000 km/s", "150 000 km/s", "30 000 km/s", "3 000 km/s"],
        "answer": "300 000 km/s",
    },
    {
        "tags": ("kimyo", "chemistry", "h2o"),
        "question": "H2O kimyoviy formulasi nimani bildiradi?",
        "options": ["Suv", "Kislorod", "Vodorod", "Tuz"],
        "answer": "Suv",
    },
    {
        "tags": ("kimyo", "chemistry", "nacl", "tuz"),
        "question": "NaCl birikmasining nomi nima?",
        "options": ["Natriy xlorid", "Kaliy xlorid", "Natriy sulfat", "Kalsiy karbonat"],
        "answer": "Natriy xlorid",
    },
    {
        "tags": ("kimyo", "chemistry", "ph"),
        "question": "pH = 7 bo'lgan eritma qanday muhitga ega?",
        "options": ["Neytral", "Kislotali", "Ishqoriy", "Gazsimon"],
        "answer": "Neytral",
    },
    {
        "tags": ("kimyo", "chemistry", "gold", "oltin"),
        "question": "Oltinning kimyoviy belgisi qaysi?",
        "options": ["Au", "Ag", "Fe", "Cu"],
        "answer": "Au",
    },
    {
        "tags": ("ingliz", "english", "lug'at", "vocabulary"),
        "question": "'Cat' so'zining o'zbekcha tarjimasi qaysi?",
        "options": ["Mushuk", "It", "Qush", "Sigir"],
        "answer": "Mushuk",
    },
    {
        "tags": ("ingliz", "english", "grammar", "zamoni"),
        "question": "'Go' fe'lining Past Simple shakli qaysi?",
        "options": ["Went", "Goed", "Gone", "Going"],
        "answer": "Went",
    },
    {
        "tags": ("ona tili", "grammatika", "noun", "ot"),
        "question": "Grammatikada 'ot' nimani bildiradi?",
        "options": ["Predmet yoki shaxs nomini", "Harakatni", "Belgini", "Soni"],
        "answer": "Predmet yoki shaxs nomini",
    },
    {
        "tags": ("informatika", "it", "html", "web"),
        "question": "HTML qisqartmasining to'liq yozilishi qaysi?",
        "options": ["HyperText Markup Language", "HighText Machine Language", "Hyper Transfer Main Link", "Home Tool Markup Language"],
        "answer": "HyperText Markup Language",
    },
    {
        "tags": ("informatika", "it", "cpu", "kompyuter"),
        "question": "CPU nimaning qisqartmasi?",
        "options": ["Central Processing Unit", "Computer Primary Unit", "Central Program Utility", "Control Processor User"],
        "answer": "Central Processing Unit",
    },
    {
        "tags": ("informatika", "it", "binary", "ikkilik"),
        "question": "Ikkilik sanoq tizimida qaysi raqamlar ishlatiladi?",
        "options": ["0 va 1", "0 dan 7 gacha", "1 dan 9 gacha", "Faqat 0"],
        "answer": "0 va 1",
    },
]


def _tag_tokens_from_text(value: str) -> tuple[str, ...]:
    tokens: list[str] = []
    for token in re.findall(r"[a-z0-9']+", value.lower()):
        if len(token) < 3:
            continue
        if token in tokens:
            continue
        tokens.append(token)
    return tuple(tokens)


def _build_pair_mcq_bank(
    *,
    pairs: list[tuple[str, str]],
    question_template: str,
    base_tags: tuple[str, ...],
) -> list[dict[str, Any]]:
    answers = [answer for _, answer in pairs]
    size = len(answers)
    items: list[dict[str, Any]] = []
    if size < 4:
        return items

    for index, (lhs, answer) in enumerate(pairs):
        distractors: list[str] = []
        jump = 5
        for step in range(1, size * 2):
            candidate = answers[(index + step * jump) % size]
            if candidate == answer or candidate in distractors:
                continue
            distractors.append(candidate)
            if len(distractors) == 3:
                break
        if len(distractors) < 3:
            for candidate in answers:
                if candidate == answer or candidate in distractors:
                    continue
                distractors.append(candidate)
                if len(distractors) == 3:
                    break
        if len(distractors) < 3:
            continue

        options = [answer, distractors[0], distractors[1], distractors[2]]
        shift = index % 4
        options = options[shift:] + options[:shift]

        tags: list[str] = list(base_tags)
        for token in (*_tag_tokens_from_text(lhs), *_tag_tokens_from_text(answer)):
            if token not in tags:
                tags.append(token)

        items.append(
            {
                "tags": tuple(tags),
                "question": question_template.format(lhs=lhs),
                "options": options,
                "answer": answer,
            },
        )
    return items


_CAPITAL_FACTS: list[tuple[str, str]] = [
    ("Fransiya", "Parij"),
    ("Germaniya", "Berlin"),
    ("Italiya", "Rim"),
    ("Ispaniya", "Madrid"),
    ("Portugaliya", "Lissabon"),
    ("Buyuk Britaniya", "London"),
    ("AQSH", "Vashington"),
    ("Kanada", "Ottava"),
    ("Meksika", "Meksiko"),
    ("Braziliya", "Braziliya"),
    ("Argentina", "Buenos-Ayres"),
    ("Misr", "Qohira"),
    ("Saudiya Arabistoni", "Ar-Riyod"),
    ("BAA", "Abu Dabi"),
    ("Turkiya", "Anqara"),
    ("Rossiya", "Moskva"),
    ("Xitoy", "Pekin"),
    ("Yaponiya", "Tokio"),
    ("Hindiston", "Nyu-Dehli"),
    ("Janubiy Koreya", "Seul"),
    ("Qozog'iston", "Astana"),
    ("Qirg'iziston", "Bishkek"),
    ("Tojikiston", "Dushanbe"),
    ("Afg'oniston", "Kobul"),
    ("Avstraliya", "Kanberra"),
    ("Yangi Zelandiya", "Vellington"),
    ("Norvegiya", "Oslo"),
    ("Shvetsiya", "Stokgolm"),
    ("Finlandiya", "Helsinki"),
    ("Polsha", "Varshava"),
]

_CURRENCY_FACTS: list[tuple[str, str]] = [
    ("O'zbekiston", "So'm"),
    ("AQSH", "AQSH dollari"),
    ("Yevro hududi", "Yevro"),
    ("Buyuk Britaniya", "Funt sterling"),
    ("Yaponiya", "Iyena"),
    ("Rossiya", "Rubl"),
    ("Xitoy", "Yuan"),
    ("Hindiston", "Hind rupiyasi"),
    ("Qozog'iston", "Tenge"),
    ("Turkiya", "Turk lirasi"),
    ("BAA", "BAA dirhami"),
    ("Saudiya Arabistoni", "Saudiya riali"),
    ("Janubiy Koreya", "Von"),
    ("Shveytsariya", "Shveytsariya franki"),
    ("Kanada", "Kanada dollari"),
    ("Avstraliya", "Avstraliya dollari"),
    ("Meksika", "Meksika pesosi"),
    ("Braziliya", "Braziliya reali"),
    ("Polsha", "Zlotiy"),
    ("Shvetsiya", "Shved kronasi"),
]

_CHEM_SYMBOL_FACTS: list[tuple[str, str]] = [
    ("Vodorod", "H"),
    ("Geliy", "He"),
    ("Uglerod", "C"),
    ("Azot", "N"),
    ("Kislorod", "O"),
    ("Natriy", "Na"),
    ("Kaliy", "K"),
    ("Kalsiy", "Ca"),
    ("Temir", "Fe"),
    ("Mis", "Cu"),
    ("Kumush", "Ag"),
    ("Oltin", "Au"),
    ("Simob", "Hg"),
    ("Qo'rg'oshin", "Pb"),
    ("Qalay", "Sn"),
    ("Rux", "Zn"),
    ("Alyuminiy", "Al"),
    ("Kremniy", "Si"),
    ("Xlor", "Cl"),
    ("Oltingugurt", "S"),
    ("Magniy", "Mg"),
    ("Fosfor", "P"),
    ("Yod", "I"),
    ("Ftor", "F"),
    ("Litiy", "Li"),
    ("Marganes", "Mn"),
    ("Nikel", "Ni"),
    ("Kobalt", "Co"),
    ("Xrom", "Cr"),
    ("Titan", "Ti"),
]

_SI_UNIT_FACTS: list[tuple[str, str]] = [
    ("kuch", "Nyuton"),
    ("bosim", "Paskal"),
    ("ish", "Joul"),
    ("quvvat", "Vatt"),
    ("elektr tok kuchi", "Amper"),
    ("elektr kuchlanish", "Volt"),
    ("elektr qarshilik", "Om"),
    ("elektr zaryad", "Kulon"),
    ("chastota", "Gerts"),
    ("sig'im", "Farad"),
    ("induktivlik", "Genri"),
    ("magnit induksiya", "Tesla"),
    ("yoritilganlik", "Lyuks"),
    ("yorug'lik oqimi", "Lumen"),
    ("harorat", "Kelvin"),
    ("modda miqdori", "Mol"),
    ("radioaktiv aktivlik", "Bekkerel"),
    ("ekvivalent doza", "Sivert"),
    ("katalitik aktivlik", "Katal"),
    ("burchak", "Radian"),
]

_IT_ABBREVIATION_FACTS: list[tuple[str, str]] = [
    ("HTML", "HyperText Markup Language"),
    ("CSS", "Cascading Style Sheets"),
    ("CPU", "Central Processing Unit"),
    ("GPU", "Graphics Processing Unit"),
    ("RAM", "Random Access Memory"),
    ("ROM", "Read Only Memory"),
    ("URL", "Uniform Resource Locator"),
    ("HTTP", "HyperText Transfer Protocol"),
    ("HTTPS", "HyperText Transfer Protocol Secure"),
    ("DNS", "Domain Name System"),
    ("SQL", "Structured Query Language"),
    ("JSON", "JavaScript Object Notation"),
    ("XML", "Extensible Markup Language"),
    ("USB", "Universal Serial Bus"),
    ("LAN", "Local Area Network"),
    ("WAN", "Wide Area Network"),
    ("API", "Application Programming Interface"),
    ("AI", "Artificial Intelligence"),
    ("ML", "Machine Learning"),
    ("OS", "Operating System"),
    ("GUI", "Graphical User Interface"),
    ("SSD", "Solid State Drive"),
    ("HDD", "Hard Disk Drive"),
    ("IP", "Internet Protocol"),
]

_ENGLISH_VOCAB_FACTS: list[tuple[str, str]] = [
    ("apple", "olma"),
    ("book", "kitob"),
    ("school", "maktab"),
    ("teacher", "o'qituvchi"),
    ("student", "o'quvchi"),
    ("water", "suv"),
    ("sun", "quyosh"),
    ("moon", "oy"),
    ("star", "yulduz"),
    ("bird", "qush"),
    ("dog", "it"),
    ("car", "mashina"),
    ("house", "uy"),
    ("city", "shahar"),
    ("country", "davlat"),
    ("friend", "do'st"),
    ("family", "oila"),
    ("garden", "bog'"),
    ("flower", "gul"),
    ("tree", "daraxt"),
    ("bread", "non"),
    ("milk", "sut"),
    ("computer", "kompyuter"),
    ("phone", "telefon"),
    ("table", "stol"),
    ("chair", "stul"),
    ("window", "deraza"),
    ("door", "eshik"),
    ("road", "yo'l"),
    ("river", "daryo"),
]

_FACTUAL_QUESTION_BANK.extend(
    _build_pair_mcq_bank(
        pairs=_CAPITAL_FACTS,
        question_template="{lhs} poytaxti qaysi shahar?",
        base_tags=("geografiya", "geography", "poytaxt", "capital", "davlat"),
    ),
)
_FACTUAL_QUESTION_BANK.extend(
    _build_pair_mcq_bank(
        pairs=_CURRENCY_FACTS,
        question_template="{lhs} rasmiy valyutasi qaysi?",
        base_tags=("iqtisod", "economy", "valyuta", "currency", "pul"),
    ),
)
_FACTUAL_QUESTION_BANK.extend(
    _build_pair_mcq_bank(
        pairs=_CHEM_SYMBOL_FACTS,
        question_template="Kimyoda {lhs} elementining belgisi qaysi?",
        base_tags=("kimyo", "chemistry", "element", "periodik"),
    ),
)
_FACTUAL_QUESTION_BANK.extend(
    _build_pair_mcq_bank(
        pairs=_SI_UNIT_FACTS,
        question_template="Fizikada {lhs} ning SI birligi qaysi?",
        base_tags=("fizika", "physics", "birlik", "si"),
    ),
)
_FACTUAL_QUESTION_BANK.extend(
    _build_pair_mcq_bank(
        pairs=_IT_ABBREVIATION_FACTS,
        question_template="{lhs} qisqartmasining to'liq yozilishi qaysi?",
        base_tags=("informatika", "it", "qisqartma", "abbreviation", "kompyuter"),
    ),
)
_FACTUAL_QUESTION_BANK.extend(
    _build_pair_mcq_bank(
        pairs=_ENGLISH_VOCAB_FACTS,
        question_template="'{lhs}' so'zining o'zbekcha tarjimasi qaysi?",
        base_tags=("ingliz", "english", "lugat", "vocabulary", "tarjima"),
    ),
)


_KEYWORD_STOPWORDS: set[str] = {
    "va",
    "yoki",
    "uchun",
    "bilan",
    "qaysi",
    "nima",
    "qanday",
    "necha",
    "nechta",
    "haqida",
    "mavzu",
    "fan",
    "the",
    "and",
    "for",
    "with",
    "what",
    "which",
    "how",
}

_TOPIC_SYNONYMS: dict[str, tuple[str, ...]] = {
    "history": ("tarix",),
    "tarix": ("history",),
    "geography": ("geografiya",),
    "geografiya": ("geography",),
    "biology": ("biologiya",),
    "biologiya": ("biology",),
    "physics": ("fizika",),
    "fizika": ("physics",),
    "chemistry": ("kimyo",),
    "kimyo": ("chemistry",),
    "english": ("ingliz",),
    "ingliz": ("english",),
    "informatics": ("informatika", "it"),
    "informatika": ("informatics", "it"),
    "capital": ("poytaxt",),
    "poytaxt": ("capital",),
    "photosynthesis": ("fotosintez",),
    "fotosintez": ("photosynthesis",),
}

_KEYWORD_SUFFIXES: tuple[str, ...] = (
    "lari",
    "lar",
    "ning",
    "dan",
    "ga",
    "da",
    "ni",
    "si",
    "i",
    "s",
)


def _compact_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _keyword_variants(token: str) -> set[str]:
    variants = {token}
    for suffix in _KEYWORD_SUFFIXES:
        if token.endswith(suffix) and len(token) - len(suffix) >= 4:
            variants.add(token[: -len(suffix)])
    return {variant for variant in variants if len(variant) >= 3}


def _text_matches_keyword(text: str, token: str) -> bool:
    for variant in _keyword_variants(token):
        if variant in text:
            return True
    return False


def _keyword_tokens(value: str | None) -> set[str]:
    if not value:
        return set()
    text = _compact_text(value).lower()
    raw_tokens = re.findall(r"[a-z0-9']+", text)
    tokens = {token for token in raw_tokens if len(token) >= 3 and token not in _KEYWORD_STOPWORDS}
    expanded: set[str] = set()
    for token in list(tokens):
        variants = _keyword_variants(token)
        expanded.update(variants)
        for variant in variants:
            expanded.update(_TOPIC_SYNONYMS.get(variant, ()))
    return expanded


def _normalize_options(options: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for option in options:
        item = _compact_text(option)
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(item)
    return cleaned


def _is_math_like_question(question: str, options: list[str]) -> bool:
    text = f"{question} {' '.join(options)}".lower()
    if re.search(r"\d+\s*[\+\-\*/x]\s*\d+", text):
        return True
    math_words = (
        "hisoblang",
        "nechiga teng",
        "yeching",
        "tenlama",
        "formula",
        "ko'paytiring",
        "bo'ling",
        "qo'shing",
        "ayiring",
    )
    return any(word in text for word in math_words)


def _is_generated_relevant(
    *,
    subject: str | None,
    topic: str,
    question: str,
    options: list[str],
    answer: str,
) -> bool:
    if _looks_math_topic(subject, topic):
        return _is_math_like_question(question, options)

    combined = _compact_text(f"{question} {' '.join(options)} {answer}").lower()
    topic_tokens = _keyword_tokens(topic)
    subject_tokens = _keyword_tokens(subject)
    required_tokens = topic_tokens or subject_tokens
    if not required_tokens:
        return True

    topic_hits = sum(1 for token in topic_tokens if _text_matches_keyword(combined, token))
    subject_hits = sum(1 for token in subject_tokens if _text_matches_keyword(combined, token))
    return topic_hits > 0 or (not topic_tokens and subject_hits > 0)


def _pick_factual_question(subject: str | None, topic: str, used_prompts: set[str] | None = None) -> tuple[str, list[str], str]:
    text = f"{subject or ''} {topic}".lower()
    topic_tokens = _keyword_tokens(topic)
    subject_tokens = _keyword_tokens(subject)
    scored: list[tuple[int, dict[str, Any]]] = []
    for item in _FACTUAL_QUESTION_BANK:
        tags = item.get("tags", ())
        score = 0
        for tag in tags:
            if not isinstance(tag, str):
                continue
            normalized_tag = tag.strip().lower()
            if not normalized_tag:
                continue
            if normalized_tag in text:
                # Topic-level tags (longer tags) get stronger boost than generic tags like "history".
                score += 6 if len(normalized_tag) >= 5 else 3
        question_text = _compact_text(str(item.get("question", ""))).lower()
        options_text = " ".join(str(value) for value in item.get("options", []))
        combined_text = _compact_text(f"{question_text} {options_text}").lower()
        score += sum(3 for token in topic_tokens if _text_matches_keyword(combined_text, token))
        score += sum(1 for token in subject_tokens if _text_matches_keyword(combined_text, token))
        scored.append((score, item))

    used = used_prompts or set()
    if scored:
        unique_scores = sorted({score for score, _ in scored}, reverse=True)
        for score_level in unique_scores:
            same_level = [item for score, item in scored if score == score_level]
            random.shuffle(same_level)
            for item in same_level:
                question = _compact_text(str(item["question"]))
                if question.lower() in used:
                    continue
                options = _normalize_options([str(value) for value in item["options"]])
                answer = _compact_text(str(item["answer"]))
                if len(options) >= 4 and answer in options:
                    return question, options[:4], answer

    fallback = random.choice(_FACTUAL_QUESTION_BANK)
    question = _compact_text(str(fallback["question"]))
    options = _normalize_options([str(value) for value in fallback["options"]])[:4]
    while len(options) < 4:
        options.append(f"Variant {chr(65 + len(options))}")
    answer = _compact_text(str(fallback["answer"]))
    if answer not in options and options:
        answer = options[0]
    return question, options, answer


def _looks_math_topic(subject: str | None, topic: str) -> bool:
    text = f"{subject or ''} {topic}".lower()
    tokens = (
        "math",
        "matemat",
        "hisob",
        "raqam",
        "number",
        "algebra",
        "geometri",
        "trigon",
        "tenlama",
        "equation",
        "fraction",
    )
    symbol_tokens = (" + ", " - ", " * ", " / ", " x ", "=")
    return any(token in text for token in tokens) or any(token in text for token in symbol_tokens)


def _build_local_fallback(
    *,
    subject: str | None,
    topic: str,
    game_id: str | None,
    difficulty: str | None,
    used_prompts: set[str] | None = None,
) -> tuple[str, list[str], str]:
    if _looks_math_topic(subject, topic):
        op = "+"
        topic_l = topic.lower()
        if any(token in topic_l for token in ("-", "ayir")):
            op = "-"
        elif any(token in topic_l for token in ("*", "x", "ko'pay", "ko‘pay")):
            op = "*"
        elif any(token in topic_l for token in ("/", "bo'l", "bo‘lish")):
            op = "/"

        max_value = 20 if difficulty == "Oson" else 60 if difficulty == "Qiyin" else 35
        if op == "+":
            a = random.randint(3, max_value)
            b = random.randint(2, max_value)
            answer_value = a + b
            prompt = f"{a} + {b} = ?"
        elif op == "-":
            a = random.randint(8, max_value)
            b = random.randint(2, max(6, int(max_value * 0.7)))
            if b > a:
                a, b = b, a
            answer_value = a - b
            prompt = f"{a} - {b} = ?"
        elif op == "*":
            a = random.randint(2, 12)
            b = random.randint(2, 12)
            answer_value = a * b
            prompt = f"{a} x {b} = ?"
        else:
            b = random.randint(2, 12)
            answer_value = random.randint(2, 18)
            a = b * answer_value
            prompt = f"{a} / {b} = ?"

        distractors: set[int] = set()
        while len(distractors) < 3:
            drift = random.randint(1, 9) * (1 if random.random() > 0.5 else -1)
            candidate = max(0, answer_value + drift)
            if candidate != answer_value:
                distractors.add(candidate)

        options = [str(answer_value), *[str(item) for item in distractors]]
        random.shuffle(options)
        answer = str(answer_value)
        return prompt, options, answer

    return _pick_factual_question(subject, topic, used_prompts=used_prompts)


def _build_generation_prompt(
    *,
    subject: str | None,
    topic: str,
    game_id: str | None,
    difficulty: str | None,
) -> str:
    is_math_intent = _looks_math_topic(subject, topic)
    if is_math_intent:
        game_hint = _GAME_PROMPT_HINTS.get(game_id or "", "Matematik savol tuzing.")
    else:
        game_hint = "Fan va mavzuga qat'iy mos bo'lsin. Matematik bo'lmagan fan uchun arifmetik misol tuzmang."
    difficulty_text = difficulty if difficulty and difficulty.strip() else "O'rta"
    game_text = game_id if game_id and game_id.strip() else "umumiy"
    subject_text = _compact_text(subject or "")
    return (
        "Siz o'zbek tilida ishlaydigan quiz generatorsiz.\n"
        f"Fan: {subject_text or 'umumiy'}\n"
        f"Mavzu: {topic}\n"
        f"Qiyinlik: {difficulty_text}\n"
        f"O'yin konteksti: {game_text}\n"
        f"Qoida: {game_hint}\n"
        "Savol real va tekshirilgan faktga asoslangan bo'lsin.\n"
        "Faqat bitta aniq to'g'ri javob bo'lsin.\n"
        "Noto'g'ri variantlar mavzuga yaqin, lekin aniq xato bo'lsin.\n"
        "Faqat JSON qaytaring. Izoh yozmang.\n"
        "Format:\n"
        "{\n"
        '  "question": "savol matni",\n'
        '  "options": ["A", "B", "C", "D"],\n'
        '  "answer": "options ichidagi bitta to\'g\'ri javob"\n'
        "}\n"
        "Variantlar 4 ta bo'lsin va bir-biridan farq qilsin."
    )


def _extract_text_from_hf_payload(payload: Any) -> str:
    if isinstance(payload, list) and payload:
        first = payload[0]
        if isinstance(first, dict):
            generated = first.get("generated_text")
            if isinstance(generated, str):
                return generated
            text = first.get("text")
            if isinstance(text, str):
                return text
        if isinstance(first, str):
            return first
    if isinstance(payload, dict):
        error_text = payload.get("error")
        if isinstance(error_text, str) and error_text.strip():
            raise ValueError(error_text.strip())
        generated = payload.get("generated_text")
        if isinstance(generated, str):
            return generated
        text = payload.get("text")
        if isinstance(text, str):
            return text
    raise ValueError("AI javobi o'qilmadi.")


def _extract_json_candidate(raw_text: str) -> dict[str, Any] | None:
    text = raw_text.strip()
    if not text:
        return None

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        candidate = text[start : end + 1]
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

    for match in re.finditer(r"\{[\s\S]*?\}", text):
        snippet = match.group(0)
        try:
            data = json.loads(snippet)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            return data
    return None


def _normalize_generated_payload(payload: dict[str, Any]) -> tuple[str, list[str], str, int]:
    question = _compact_text(str(payload.get("question", "")))
    if not question:
        raise ValueError("AI savol matni bo'sh qaytdi.")

    raw_options = payload.get("options")
    options: list[str]
    if isinstance(raw_options, list):
        options = [str(item) for item in raw_options]
    elif isinstance(raw_options, str):
        options = [item.strip() for item in re.split(r"[,\n;|]", raw_options) if item.strip()]
    else:
        options = []
    options = _normalize_options(options)

    answer = _compact_text(str(payload.get("answer", "")))
    correct_index_raw = payload.get("correct_index")
    if not answer and isinstance(correct_index_raw, int) and 0 <= correct_index_raw < len(options):
        answer = options[correct_index_raw]

    if answer and answer not in options:
        if len(options) < 4:
            options.append(answer)
        else:
            options[0] = answer

    options = _normalize_options(options)
    while len(options) < 4:
        options.append(f"Variant {chr(65 + len(options))}")
    options = options[:4]

    if not answer or answer not in options:
        answer = options[0]
    correct_index = options.index(answer)
    return question, options, answer, correct_index


def _generate_via_huggingface(
    *,
    subject: str | None,
    topic: str,
    game_id: str | None,
    difficulty: str | None,
) -> tuple[str, list[str], str, int]:
    if not settings.ai_hf_api_token:
        raise ValueError("AI_HF_API_TOKEN topilmadi.")

    prompt = _build_generation_prompt(subject=subject, topic=topic, game_id=game_id, difficulty=difficulty)
    url = f"https://api-inference.huggingface.co/models/{settings.ai_hf_model}"

    try:
        with httpx.Client(timeout=settings.ai_request_timeout_seconds) as client:
            response = client.post(
                url,
                headers={"Authorization": f"Bearer {settings.ai_hf_api_token}"},
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 260,
                        "temperature": 0.55,
                        "return_full_text": False,
                    },
                    "options": {"wait_for_model": True},
                },
            )
    except httpx.HTTPError as exc:
        raise ValueError(f"HuggingFace so'rovi bajarilmadi: {exc}") from exc

    if response.status_code >= 400:
        try:
            payload = response.json()
            details = payload.get("error") if isinstance(payload, dict) else str(payload)
        except Exception:
            details = response.text
        raise ValueError(f"HuggingFace xatosi ({response.status_code}): {details}")

    payload = response.json()
    raw_text = _extract_text_from_hf_payload(payload)
    extracted = _extract_json_candidate(raw_text)
    if extracted is None:
        raise ValueError("AI JSON formatda javob bermadi.")
    return _normalize_generated_payload(extracted)


@router.get("", response_model=list[QuestionRead])
def list_questions(
    game_id: str | None = None,
    teacher_id: uuid.UUID | None = None,
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[QuestionRead]:
    query: Select[tuple[Question]] = select(Question)

    if game_id:
        query = query.where(Question.game_id == game_id)
    if not include_archived:
        query = query.where(Question.is_archived.is_(False))

    if current_user.role == UserRole.ADMIN:
        if teacher_id:
            query = query.where(Question.teacher_id == teacher_id)
    else:
        query = query.where(Question.teacher_id == current_user.id)

    query = query.order_by(Question.created_at.desc())
    records = db.scalars(query).all()
    return [QuestionRead.model_validate(record) for record in records]


@router.post("/generate-ai", response_model=AIQuestionGenerateResponse)
def generate_ai_question(
    payload: AIQuestionGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIQuestionGenerateResponse:
    if current_user.role not in {UserRole.ADMIN, UserRole.TEACHER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI savol yaratishga ruxsat yo'q.")

    subject = payload.subject.strip() if payload.subject and payload.subject.strip() else None
    topic = payload.topic.strip()
    if not topic:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Mavzu bo'sh bo'lmasin.")
    count = max(1, min(20, payload.count))

    game_id = payload.game_id.strip() if payload.game_id else None
    if game_id:
        game = db.get(Game, game_id)
        if game is None or not game.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="O'yin topilmadi.")

    is_math_intent = _looks_math_topic(subject, topic)
    provider = f"huggingface:{settings.ai_hf_model}" if settings.ai_hf_api_token else "fallback"
    items: list[AIQuestionItem] = []
    used_prompts: set[str] = set()
    attempts = 0
    max_attempts = max(12, count * 6)

    while len(items) < count and attempts < max_attempts:
        attempts += 1
        try:
            question, options, answer, correct_index = _generate_via_huggingface(
                subject=subject,
                topic=topic,
                game_id=game_id,
                difficulty=payload.difficulty,
            )
            if not is_math_intent and _is_math_like_question(question, options):
                raise ValueError("Mavzuga mos bo'lmagan matematik savol qaytdi.")
            if not _is_generated_relevant(
                subject=subject,
                topic=topic,
                question=question,
                options=options,
                answer=answer,
            ):
                raise ValueError("AI mavzuga mos savol qaytarmadi.")
        except ValueError:
            provider = "fallback"
            fallback_question, fallback_options, fallback_answer = _build_local_fallback(
                subject=subject,
                topic=topic,
                game_id=game_id,
                difficulty=payload.difficulty,
                used_prompts=used_prompts,
            )
            options = _normalize_options(fallback_options)
            while len(options) < 4:
                options.append(f"Variant {chr(65 + len(options))}")
            options = options[:4]
            answer = fallback_answer if fallback_answer in options else options[0]
            question = fallback_question
            correct_index = options.index(answer)

        prompt_key = _compact_text(question).lower()
        if not prompt_key:
            continue
        if prompt_key in used_prompts:
            continue
        used_prompts.add(prompt_key)
        items.append(
            AIQuestionItem(
                question=question,
                options=options,
                answer=answer,
                correct_index=correct_index,
            ),
        )

    while len(items) < count:
        provider = "fallback"
        fallback_question, fallback_options, fallback_answer = _build_local_fallback(
            subject=subject,
            topic=topic,
            game_id=game_id,
            difficulty=payload.difficulty,
            used_prompts=used_prompts,
        )
        options = _normalize_options(fallback_options)
        while len(options) < 4:
            options.append(f"Variant {chr(65 + len(options))}")
        options = options[:4]
        answer = fallback_answer if fallback_answer in options else options[0]
        correct_index = options.index(answer)
        items.append(
            AIQuestionItem(
                question=fallback_question,
                options=options,
                answer=answer,
                correct_index=correct_index,
            ),
        )

    first = items[0]

    return AIQuestionGenerateResponse(
        question=first.question,
        options=first.options,
        answer=first.answer,
        correct_index=first.correct_index,
        items=items,
        requested_count=count,
        generated_count=len(items),
        provider=provider,
    )


@router.post("", response_model=QuestionRead, status_code=status.HTTP_201_CREATED)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuestionRead:
    game = db.get(Game, payload.game_id)
    if game is None or not game.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="O'yin topilmadi.")

    owner_id = current_user.id
    if current_user.role == UserRole.ADMIN and payload.teacher_id is not None:
        owner_id = payload.teacher_id
    elif current_user.role != UserRole.ADMIN and payload.teacher_id and payload.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa teacher nomidan yozib bo'lmaydi.")

    sanitized_options = [item.strip() for item in payload.options if item.strip()]
    _validate_question(
        question_type=payload.question_type,
        options=sanitized_options,
        correct_index=payload.correct_index,
        answer_text=payload.answer_text,
    )

    question = Question(
        teacher_id=owner_id,
        game_id=payload.game_id,
        question_type=payload.question_type,
        prompt=payload.prompt.strip(),
        options=sanitized_options,
        correct_index=payload.correct_index,
        answer_text=payload.answer_text.strip() if payload.answer_text else None,
        hint=payload.hint.strip() if payload.hint else None,
        difficulty=payload.difficulty,
        metadata_json=payload.metadata_json,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionRead.model_validate(question)


@router.post("/seed-demo", response_model=QuestionRead)
def seed_demo_question(
    game_id: str = "box-jang",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuestionRead:
    game = db.get(Game, game_id)
    if game is None or not game.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="O'yin topilmadi.")

    prompt = "12 + 8 = ?"
    existing = db.scalar(
        select(Question).where(
            Question.teacher_id == current_user.id,
            Question.game_id == game_id,
            Question.prompt == prompt,
        ),
    )
    if existing is not None:
        return QuestionRead.model_validate(existing)

    question = Question(
        teacher_id=current_user.id,
        game_id=game_id,
        question_type=QuestionType.MULTIPLE_CHOICE,
        prompt=prompt,
        options=["18", "20", "22", "24"],
        correct_index=1,
        difficulty="O'rta",
        hint="Qo'shish amali",
        metadata_json={"seed": "demo"},
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionRead.model_validate(question)


@router.get("/{question_id}", response_model=QuestionRead)
def get_question(
    question_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuestionRead:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi.")
    if not _can_manage_question(current_user, question):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu savolga ruxsat yo'q.")
    return QuestionRead.model_validate(question)


@router.patch("/{question_id}", response_model=QuestionRead)
def update_question(
    question_id: uuid.UUID,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuestionRead:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi.")
    if not _can_manage_question(current_user, question):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu savolni tahrirlashga ruxsat yo'q.")

    updates = payload.model_dump(exclude_unset=True)

    if "game_id" in updates:
        game = db.get(Game, updates["game_id"])
        if game is None or not game.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Yangi game_id topilmadi.")

    if "prompt" in updates and updates["prompt"] is not None:
        updates["prompt"] = updates["prompt"].strip()
    if "hint" in updates and updates["hint"] is not None:
        updates["hint"] = updates["hint"].strip()
    if "answer_text" in updates and updates["answer_text"] is not None:
        updates["answer_text"] = updates["answer_text"].strip()
    if "options" in updates and updates["options"] is not None:
        updates["options"] = [item.strip() for item in updates["options"] if item.strip()]

    for field, value in updates.items():
        setattr(question, field, value)

    _validate_question(
        question_type=question.question_type,
        options=question.options,
        correct_index=question.correct_index,
        answer_text=question.answer_text,
    )

    db.commit()
    db.refresh(question)
    return QuestionRead.model_validate(question)


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi.")
    if not _can_manage_question(current_user, question):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu savolni o'chirishga ruxsat yo'q.")
    db.delete(question)
    db.commit()
