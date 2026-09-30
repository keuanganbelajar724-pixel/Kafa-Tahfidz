// Arabic and Phonetic Voice Matching and Tashih Engine

export interface WordMatchStatus {
  word: string;
  cleanWord: string;
  status: 'pending' | 'active' | 'correct' | 'wrong';
}

/**
 * Remove Arabic Harakat / Diacritics / Quranic Symbols
 */
export function removeArabicHarakat(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Harakat & Tajweed markers
    .replace(/[إأآاٱ]/g, 'ا') // Normalize Alef
    .replace(/[ىي]/g, 'ي') // Normalize Ya
    .replace(/[ة]/g, 'ه') // Normalize Ta Marbuta
    .replace(/[ؤ]/g, 'و') // Normalize Waw with Hamza
    .replace(/[ئ]/g, 'ي') // Normalize Ya with Hamza
    .replace(/[\u0640]/g, '') // Remove Tatweel (Kashida)
    .replace(/[^\u0600-\u06FF\s]/g, '') // Keep only Arabic letters and spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize Latin Transliteration for phonetic matching
 */
export function normalizeLatinText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/['`’‘\-]/g, '')
    .replace(/aa|a\^|ā/g, 'a')
    .replace(/ii|i\^|ī/g, 'i')
    .replace(/uu|u\^|ū/g, 'u')
    .replace(/ro/g, 'ra')
    .replace(/dho/g, 'dha')
    .replace(/sho/g, 'sha')
    .replace(/to/g, 'ta')
    .replace(/dzo/g, 'dza')
    .replace(/zo/g, 'za')
    .replace(/sh|sy/g, 's')
    .replace(/th/g, 't')
    .replace(/dh|dz/g, 'z')
    .replace(/ts/g, 's')
    .replace(/gh/g, 'g')
    .replace(/kh/g, 'k')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute Levenshtein distance between two strings
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio (0.0 to 1.0)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1.0;

  const dist = computeLevenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return maxLen === 0 ? 1.0 : Math.max(0, 1 - dist / maxLen);
}

/**
 * Match Spoken Recitation with Target Ayah
 * Returns detailed evaluation with accuracy, match status, and whether it passes the gate
 */
export function evaluateAyahVoiceRecitation(
  targetArabic: string,
  targetLatin: string,
  spokenText: string
): {
  isCorrect: boolean;
  score: number;
  matchedCount: number;
  totalWords: number;
  wordStatuses: WordMatchStatus[];
  feedbackMessage: string;
} {
  const cleanTargetArabic = removeArabicHarakat(targetArabic);
  const cleanSpokenArabic = removeArabicHarakat(spokenText);
  const cleanTargetLatin = normalizeLatinText(targetLatin);
  const cleanSpokenLatin = normalizeLatinText(spokenText);

  const rawWords = targetArabic.split(/\s+/).filter(Boolean);
  const targetWordTokens = cleanTargetArabic.split(/\s+/).filter(Boolean);
  const spokenWordTokens = cleanSpokenArabic.split(/\s+/).filter(Boolean);

  const totalWords = targetWordTokens.length;
  let matchedCount = 0;

  const wordStatuses: WordMatchStatus[] = rawWords.map((word, idx) => {
    const cleanWord = targetWordTokens[idx] || removeArabicHarakat(word);
    
    // Check if clean word exists in spoken tokens or is substring
    const isDirectMatch = spokenWordTokens.some((spokenToken) => {
      if (spokenToken === cleanWord) return true;
      if (cleanWord.length >= 3 && (spokenToken.includes(cleanWord) || cleanWord.includes(spokenToken))) {
        return true;
      }
      return calculateSimilarity(spokenToken, cleanWord) >= 0.70;
    });

    if (isDirectMatch) {
      matchedCount++;
      return { word, cleanWord, status: 'correct' };
    } else {
      return { word, cleanWord, status: 'pending' };
    }
  });

  // Calculate overall similarity
  const arabicSimilarity = calculateSimilarity(cleanTargetArabic, cleanSpokenArabic);
  const latinSimilarity = calculateSimilarity(cleanTargetLatin, cleanSpokenLatin);
  const bestSimilarity = Math.max(arabicSimilarity, latinSimilarity);

  // Consider correct if either word ratio >= 70% or overall string similarity >= 65%
  const wordRatio = totalWords > 0 ? matchedCount / totalWords : 0;
  const isCorrect = wordRatio >= 0.65 || bestSimilarity >= 0.60;

  const score = Math.round(Math.max(wordRatio * 100, bestSimilarity * 100));

  let feedbackMessage = '';
  if (isCorrect) {
    feedbackMessage = '🌟 Masya Allah! Bacaanmu Tepat dan Lancar. Gembok Terbuka! 🔓';
  } else {
    feedbackMessage = '⚠️ Bacaan belum tepat atau ada harakat/lafadz yang terlewat. Silakan ulangi ayat ini dengan benar untuk membuka ayat berikutnya!';
  }

  return {
    isCorrect,
    score: Math.min(100, Math.max(0, score)),
    matchedCount,
    totalWords,
    wordStatuses,
    feedbackMessage,
  };
}
