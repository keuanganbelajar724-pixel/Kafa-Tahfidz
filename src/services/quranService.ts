import { Surah, Ayah, JuzInfo } from '../types';
import { ALL_114_SURAHS, JUZ_30_INFO_LIST, SurahCatalogItem } from '../data/quran30JuzData';
import { QURAN_SURAHS, getEveryAyahAudioUrl } from '../data/quranData';

// In-memory cache for loaded surahs
const surahCache = new Map<number, Surah>();

// Pre-populate with bundled surahs from quranData.ts
QURAN_SURAHS.forEach((s) => {
  surahCache.set(s.id, s);
});

/**
 * Get catalog of all 114 surahs, optionally filtered by Juz
 */
export function getAllSurahCatalog(juzNumber?: number): SurahCatalogItem[] {
  if (juzNumber && juzNumber >= 1 && juzNumber <= 30) {
    return ALL_114_SURAHS.filter((s) => s.juzList.includes(juzNumber) || s.juzNumber === juzNumber);
  }
  return ALL_114_SURAHS;
}

/**
 * Get all 30 Juz metadata list
 */
export function getAllJuzList(): JuzInfo[] {
  return JUZ_30_INFO_LIST;
}

/**
 * Get info for a specific Juz (1-30)
 */
export function getJuzInfo(juzNumber: number): JuzInfo | undefined {
  return JUZ_30_INFO_LIST.find((j) => j.juzNumber === juzNumber);
}

/**
 * Get catalog item for a surah ID
 */
export function getSurahCatalogItem(surahId: number): SurahCatalogItem | undefined {
  return ALL_114_SURAHS.find((s) => s.id === surahId);
}

/**
 * Synchronous get surah (returns cached or bundled, or generates template)
 */
export function getSurahSync(surahId: number): Surah | undefined {
  if (surahCache.has(surahId)) {
    return surahCache.get(surahId);
  }

  // Check localStorage cache
  try {
    const saved = localStorage.getItem(`kafa_quran_surah_${surahId}`);
    if (saved) {
      const parsed = JSON.parse(saved) as Surah;
      if (parsed && parsed.ayat && parsed.ayat.length > 0) {
        surahCache.set(surahId, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }

  // Fallback to catalog basic info
  const cat = getSurahCatalogItem(surahId);
  if (!cat) return undefined;

  return {
    id: cat.id,
    nameId: cat.nameId,
    nameLatin: cat.nameLatin,
    nameArabic: cat.nameArabic,
    translationName: cat.translationName,
    meaningId: cat.meaningId,
    totalAyat: cat.totalAyat,
    revelationType: cat.revelationType,
    juzNumber: cat.juzNumber,
    description: cat.description,
    ayat: [],
  };
}

/**
 * Fetch full Surah with all ayat (Arabic, Latin, Indonesian Translation, and Audio)
 * Checks cache -> localStorage -> equran.id API -> alquran.cloud API
 */
export async function fetchFullSurah(surahId: number): Promise<Surah> {
  // 1. Check in-memory cache
  if (surahCache.has(surahId)) {
    const cached = surahCache.get(surahId)!;
    if (cached.ayat && cached.ayat.length > 0) {
      return cached;
    }
  }

  // 2. Check localStorage
  try {
    const local = localStorage.getItem(`kafa_quran_surah_${surahId}`);
    if (local) {
      const parsed = JSON.parse(local) as Surah;
      if (parsed && parsed.ayat && parsed.ayat.length >= parsed.totalAyat) {
        surahCache.set(surahId, parsed);
        return parsed;
      }
    }
  } catch {
    // Storage access issue
  }

  const catalog = getSurahCatalogItem(surahId) || {
    id: surahId,
    nameId: `Surah ${surahId}`,
    nameLatin: `Surah ${surahId}`,
    nameArabic: '',
    translationName: '',
    meaningId: '',
    totalAyat: 10,
    revelationType: 'Makkiyah' as const,
    juzNumber: 1,
    juzList: [1],
    description: '',
  };

  // 3. Try fetching from equran.id API (Official Indonesian Kemenag source)
  try {
    const response = await fetch(`https://equran.id/api/v2/surat/${surahId}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      const json = await response.json();
      if (json.data && Array.isArray(json.data.ayat)) {
        const loadedAyat: Ayah[] = json.data.ayat.map((item: any) => ({
          id: surahId * 1000 + item.nomorAyat,
          surahId,
          ayahNumber: item.nomorAyat,
          textArabic: item.teksArab || '',
          textLatin: item.teksLatin || '',
          translationId: item.teksIndonesia || '',
          audioUrl:
            item.audio?.['05'] ||
            item.audio?.['01'] ||
            getEveryAyahAudioUrl(surahId, item.nomorAyat),
        }));

        const fullSurah: Surah = {
          id: surahId,
          nameId: json.data.namaLatin || catalog.nameId,
          nameLatin: json.data.namaLatin || catalog.nameLatin,
          nameArabic: json.data.nama || catalog.nameArabic,
          translationName: json.data.arti || catalog.translationName,
          meaningId: json.data.arti || catalog.meaningId,
          totalAyat: json.data.jumlahAyat || catalog.totalAyat,
          revelationType:
            json.data.tempatTurun === 'Madinah' ? 'Madaniyah' : 'Makkiyah',
          juzNumber: catalog.juzNumber,
          description:
            json.data.deskripsi?.replace(/<[^>]*>?/gm, '') || catalog.description,
          ayat: loadedAyat,
        };

        surahCache.set(surahId, fullSurah);
        try {
          localStorage.setItem(`kafa_quran_surah_${surahId}`, JSON.stringify(fullSurah));
        } catch {
          // Quota exceeded
        }
        return fullSurah;
      }
    }
  } catch (err) {
    console.warn(`Primary API fetch failed for surah ${surahId}, trying mirror...`, err);
  }

  // 4. Try fetching from Al-Quran Cloud (Global mirror)
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,id.indonesian`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length >= 2) {
        const arabicData = data.data[0];
        const indoData = data.data[1];

        const ayatList: Ayah[] = arabicData.ayahs.map((ayahObj: any, index: number) => {
          const num = ayahObj.numberInSurah;
          return {
            id: surahId * 1000 + num,
            surahId,
            ayahNumber: num,
            textArabic: ayahObj.text,
            textLatin: `Ayat ke-${num}`,
            translationId: indoData.ayahs[index]?.text || '',
            audioUrl: getEveryAyahAudioUrl(surahId, num),
          };
        });

        const fullSurah: Surah = {
          id: surahId,
          nameId: catalog.nameId,
          nameLatin: catalog.nameLatin,
          nameArabic: arabicData.name || catalog.nameArabic,
          translationName: catalog.translationName,
          meaningId: catalog.meaningId,
          totalAyat: arabicData.numberOfAyahs || catalog.totalAyat,
          revelationType:
            arabicData.revelationType === 'Medinan' ? 'Madaniyah' : 'Makkiyah',
          juzNumber: catalog.juzNumber,
          description: catalog.description,
          ayat: ayatList,
        };

        surahCache.set(surahId, fullSurah);
        try {
          localStorage.setItem(`kafa_quran_surah_${surahId}`, JSON.stringify(fullSurah));
        } catch {
          // Quota exceeded
        }
        return fullSurah;
      }
    }
  } catch (err2) {
    console.warn(`Secondary API fetch failed for surah ${surahId}`, err2);
  }

  // 5. Fallback: generate placeholder ayat with direct audio links
  const placeholderAyat: Ayah[] = Array.from({ length: catalog.totalAyat }).map((_, i) => {
    const aNum = i + 1;
    return {
      id: surahId * 1000 + aNum,
      surahId,
      ayahNumber: aNum,
      textArabic: aNum === 1 && surahId !== 9 && surahId !== 1 ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' : `آية ${aNum}`,
      textLatin: `Ayat ${aNum} Surat ${catalog.nameLatin}`,
      translationId: `Ayat ${aNum} dari Surat ${catalog.nameId} (${catalog.translationName}). Terdiri dari ${catalog.totalAyat} ayat dalam Juz ${catalog.juzNumber}.`,
      audioUrl: getEveryAyahAudioUrl(surahId, aNum),
    };
  });

  const fallbackSurah: Surah = {
    id: catalog.id,
    nameId: catalog.nameId,
    nameLatin: catalog.nameLatin,
    nameArabic: catalog.nameArabic,
    translationName: catalog.translationName,
    meaningId: catalog.meaningId,
    totalAyat: catalog.totalAyat,
    revelationType: catalog.revelationType,
    juzNumber: catalog.juzNumber,
    description: catalog.description,
    ayat: placeholderAyat,
  };

  surahCache.set(surahId, fallbackSurah);
  return fallbackSurah;
}

export interface ReciterInfo {
  id: string;
  name: string;
  sub: string;
  folder: string;
}

export const RECITERS_LIST: ReciterInfo[] = [
  {
    id: 'alafasy',
    name: 'Syaikh Mishary Rashid Alafasy',
    sub: 'Lantunan Merdu, Irama Indah & Terpopuler',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'husary_muallim',
    name: 'Syaikh Mahmoud Khalil Al-Husary (Muallim)',
    sub: 'Tartil Edukatif Terbaik untuk Anak-anak & Pemula',
    folder: 'Husary_Muallim_128kbps',
  },
  {
    id: 'husary_murattal',
    name: 'Syaikh Mahmoud Khalil Al-Husary (Murattal)',
    sub: 'Standar Emas Tajwid & Makhraj Internasional',
    folder: 'Husary_128kbps',
  },
  {
    id: 'sudais',
    name: 'Syaikh Abdul Rahman Al-Sudais',
    sub: 'Imam Besar Masjidil Haram Makkah',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
  },
  {
    id: 'shuraim',
    name: 'Syaikh Saud Ash-Shuraim',
    sub: 'Mantan Imam Shalat Tarawih Masjidil Haram Makkah',
    folder: 'Saood_ash-Shuraym_128kbps',
  },
  {
    id: 'ghamadi',
    name: 'Syaikh Saad Al-Ghamdi',
    sub: 'Irama Khas Khusyuk, Tenang & Menentramkan Hati',
    folder: 'Ghamadi_40kbps',
  },
  {
    id: 'minshawy_mujawwad',
    name: 'Syaikh Muhammad Siddiq Al-Minshawi (Mujawwad)',
    sub: 'Lagu Tilawah Klasik & Tajwid Fasih',
    folder: 'Minshawy_Mujawwad_192kbps',
  },
  {
    id: 'minshawy_murattal',
    name: 'Syaikh Muhammad Siddiq Al-Minshawi (Murattal)',
    sub: 'Tartil Khusyuk Penuh Penghayatan',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'muaiqly',
    name: 'Syaikh Maher Al-Muaiqly',
    sub: 'Imam Masjidil Haram Makkah (Suara Jernih & Merdu)',
    folder: 'MaherAlMuaiqly128kbps',
  },
  {
    id: 'dussary',
    name: 'Syaikh Yasser Al-Dosari',
    sub: 'Imam Masjidil Haram Makkah (Suara Khas Bergetar Syahdu)',
    folder: 'Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'qatami',
    name: 'Syaikh Nasser Al-Qatami',
    sub: 'Irama Riyadh Populer, Sangat Menyentuh Hati',
    folder: 'Nasser_Alqatami_128kbps',
  },
  {
    id: 'shatri',
    name: 'Syaikh Abu Bakr Ash-Shatri',
    sub: 'Lantunan Syahdu, Rapi & Menggetarkan Jiwa',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
  },
  {
    id: 'ali_jaber',
    name: 'Syaikh Ali Jaber (Rahimahullah)',
    sub: 'Legenda Imam Masjidil Haram Era 1980-an',
    folder: 'Ali_Jaber_64kbps',
  },
  {
    id: 'hani_rifai',
    name: 'Syaikh Hani Ar-Rifai',
    sub: 'Lantunan Penuh Tangis, Khusyuk & Menghanyutkan',
    folder: 'Hani_Rifai_192kbps',
  },
  {
    id: 'basfar',
    name: 'Syaikh Abdullah Basfar',
    sub: 'Artikulasi Jelas & Teratur untuk Latihan Tajwid',
    folder: 'Abdullah_Basfar_192kbps',
  },
  {
    id: 'hudhaify',
    name: 'Syaikh Ali Al-Hudhaify',
    sub: 'Imam Utama Masjid Nabawi Madinah Munawwarah',
    folder: 'Hudhaify_128kbps',
  },
  {
    id: 'ayman_suwayd',
    name: 'Dr. Syaikh Ayman Suwayd',
    sub: 'Ulama Pakar Tajwid & Sanad Qira\'at Dunia',
    folder: 'Ayman_Sowaid_64kbps',
  },
  {
    id: 'muhammad_ayyoub',
    name: 'Syaikh Muhammad Ayyub (Rahimahullah)',
    sub: 'Legenda Imam Shalat Malam Masjid Nabawi Madinah',
    folder: 'Muhammad_Ayyoub_128kbps',
  },
];

export function getAyahAudioUrlWithReciter(
  surahId: number,
  ayahNumber: number,
  reciterFolder: string = 'Alafasy_128kbps'
): string {
  const sStr = surahId.toString().padStart(3, '0');
  const aStr = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/${reciterFolder}/${sStr}${aStr}.mp3`;
}

/**
 * Get popular surahs for quick shortcuts
 */
export function getPopularSurahs(): SurahCatalogItem[] {
  const popularIds = [1, 2, 18, 36, 55, 56, 67, 78, 93, 112, 113, 114];
  return ALL_114_SURAHS.filter((s) => popularIds.includes(s.id));
}
