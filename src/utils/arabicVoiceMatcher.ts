// Arabic and Phonetic Voice Matching and Tashih Engine

export interface WordMatchStatus {
  word: string;
  cleanWord: string;
  status: 'pending' | 'active' | 'correct' | 'wrong';
}

export type MatchSensitivity = 'strict' | 'standard' | 'lenient';

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
 * Normalize Latin Transliteration for phonetic matching without collapsing different letters
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
  spokenText: string,
  sensitivity: MatchSensitivity = 'strict'
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

  const targetLatinTokens = cleanTargetLatin.split(/\s+/).filter(Boolean);
  const spokenLatinTokens = cleanSpokenLatin.split(/\s+/).filter(Boolean);

  const totalWords = targetWordTokens.length;
  let matchedCount = 0;
  let firstWrongIndex = -1;

  // Thresholds based on sensitivity
  // In strict mode, words require high accuracy (>= 85%) and missing words are strictly rejected.
  const wordThreshold = sensitivity === 'strict' ? 0.85 : sensitivity === 'standard' ? 0.80 : 0.70;
  const overallThreshold = sensitivity === 'strict' ? 0.82 : sensitivity === 'standard' ? 0.75 : 0.65;

  let spokenCursor = 0;

  const wordStatuses: WordMatchStatus[] = rawWords.map((word, idx) => {
    const cleanWord = targetWordTokens[idx] || removeArabicHarakat(word);
    const latinWord = targetLatinTokens[idx] || '';

    let matched = false;

    // 1. Check in sequence within spoken tokens
    for (let sIdx = spokenCursor; sIdx < Math.min(spokenWordTokens.length, spokenCursor + 3); sIdx++) {
      const spoken = spokenWordTokens[sIdx];
      if (spoken === cleanWord) {
        matched = true;
        spokenCursor = sIdx + 1;
        break;
      }
      if (cleanWord.length >= 3 && calculateSimilarity(spoken, cleanWord) >= wordThreshold) {
        matched = true;
        spokenCursor = sIdx + 1;
        break;
      }
    }

    // 2. Check Latin phonetic match if Arabic didn't match
    if (!matched && latinWord) {
      for (let sIdx = 0; sIdx < spokenLatinTokens.length; sIdx++) {
        const spoken = spokenLatinTokens[sIdx];
        if (spoken === latinWord) {
          matched = true;
          break;
        }
        if (latinWord.length >= 3 && calculateSimilarity(spoken, latinWord) >= wordThreshold) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      matchedCount++;
      return { word, cleanWord, status: 'correct' };
    } else {
      if (firstWrongIndex === -1) firstWrongIndex = idx;
      return { word, cleanWord, status: 'wrong' };
    }
  });

  // Calculate overall string similarity
  const arabicSimilarity = calculateSimilarity(cleanTargetArabic, cleanSpokenArabic);
  const latinSimilarity = calculateSimilarity(cleanTargetLatin, cleanSpokenLatin);
  const bestSimilarity = Math.max(arabicSimilarity, latinSimilarity);

  // Strict Evaluation:
  // If user made a mistake in letters/words, it must NOT pass just because the ending was correct!
  const wordRatio = totalWords > 0 ? matchedCount / totalWords : 0;
  
  let isCorrect = false;
  if (sensitivity === 'strict') {
    // In strict mode: All words must match (or at least 90% if very long verse) AND overall similarity >= 82%
    isCorrect = totalWords <= 4 
      ? matchedCount === totalWords && bestSimilarity >= 0.80
      : wordRatio >= 0.90 && bestSimilarity >= 0.80;
  } else if (sensitivity === 'standard') {
    isCorrect = wordRatio >= 0.80 && bestSimilarity >= 0.75;
  } else {
    isCorrect = wordRatio >= 0.70 || bestSimilarity >= 0.65;
  }

  const score = Math.round(Math.max(wordRatio * 100, bestSimilarity * 100));

  let feedbackMessage = '';
  if (isCorrect) {
    feedbackMessage = '🌟 Masya Allah! Seluruh Lafadz Tepat, Tartil & Fasih. Gembok Terbuka! 🔓';
  } else {
    if (firstWrongIndex !== -1 && rawWords[firstWrongIndex]) {
      feedbackMessage = `⛔ Lafadz kata ke-${firstWrongIndex + 1} ("${rawWords[firstWrongIndex]}") keliru atau belum lengkap. Harap baca seluruh ayat dengan teliti dari awal sampai akhir!`;
    } else {
      feedbackMessage = '⚠️ Bacaan belum tepat atau ada huruf/kata yang terlewat. Silakan ulangi ayat ini dengan benar untuk membuka ayat berikutnya!';
    }
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
