// Arabic and Phonetic Voice Matching and Tashih Engine (Tarteel AI Style)

export interface WordMatchStatus {
  word: string;
  cleanWord: string;
  status: 'pending' | 'active' | 'correct' | 'wrong';
  spokenWord?: string;
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
 * Match Spoken Recitation with Target Ayah (Tarteel AI Style Precision)
 * Strictly evaluates every word in sequence. Never passes if middle words or letters are incorrect!
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
  errorDetail?: {
    wordIndex: number;
    expectedWord: string;
    expectedClean: string;
    heardWord?: string;
  };
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
  let errorDetail: {
    wordIndex: number;
    expectedWord: string;
    expectedClean: string;
    heardWord?: string;
  } | undefined = undefined;

  // Word-level similarity threshold
  // In strict mode, words must be >= 0.88 similar to pass (almost exact match)
  const wordThreshold = sensitivity === 'strict' ? 0.88 : sensitivity === 'standard' ? 0.80 : 0.72;

  let spokenCursor = 0;

  const wordStatuses: WordMatchStatus[] = rawWords.map((word, idx) => {
    const cleanWord = targetWordTokens[idx] || removeArabicHarakat(word);
    const latinWord = targetLatinTokens[idx] || '';

    let matched = false;
    let matchedSpoken = '';

    // Check sequentially in spoken tokens starting from current cursor
    // Restrict lookahead window to prevent random jumps across the verse
    const lookaheadLimit = Math.min(spokenWordTokens.length, spokenCursor + 2);
    for (let sIdx = spokenCursor; sIdx < lookaheadLimit; sIdx++) {
      const spoken = spokenWordTokens[sIdx];
      if (spoken === cleanWord) {
        matched = true;
        matchedSpoken = spoken;
        spokenCursor = sIdx + 1;
        break;
      }
      if (cleanWord.length >= 2 && calculateSimilarity(spoken, cleanWord) >= wordThreshold) {
        matched = true;
        matchedSpoken = spoken;
        spokenCursor = sIdx + 1;
        break;
      }
    }

    // Secondary Latin phonetic fallback check
    if (!matched && latinWord) {
      for (let sIdx = spokenCursor; sIdx < Math.min(spokenLatinTokens.length, spokenCursor + 2); sIdx++) {
        const spoken = spokenLatinTokens[sIdx];
        if (spoken === latinWord) {
          matched = true;
          matchedSpoken = spoken;
          spokenCursor = sIdx + 1;
          break;
        }
        if (latinWord.length >= 3 && calculateSimilarity(spoken, latinWord) >= wordThreshold) {
          matched = true;
          matchedSpoken = spoken;
          spokenCursor = sIdx + 1;
          break;
        }
      }
    }

    if (matched) {
      matchedCount++;
      return { word, cleanWord, status: 'correct', spokenWord: matchedSpoken };
    } else {
      if (firstWrongIndex === -1) {
        firstWrongIndex = idx;
        const heard = spokenWordTokens[spokenCursor] || spokenLatinTokens[spokenCursor];
        errorDetail = {
          wordIndex: idx,
          expectedWord: word,
          expectedClean: cleanWord,
          heardWord: heard,
        };
      }
      return { word, cleanWord, status: 'wrong' };
    }
  });

  // Calculate overall string similarity
  const arabicSimilarity = calculateSimilarity(cleanTargetArabic, cleanSpokenArabic);
  const latinSimilarity = calculateSimilarity(cleanTargetLatin, cleanSpokenLatin);
  const bestSimilarity = Math.max(arabicSimilarity, latinSimilarity);

  // Strict Evaluation to eliminate false positives:
  // If user only read the last word, matchedCount will only be 1 out of totalWords!
  // In Tarteel AI, the recitation MUST cover the entire verse accurately from start to finish!
  const wordRatio = totalWords > 0 ? matchedCount / totalWords : 0;
  
  let isCorrect = false;
  if (sensitivity === 'strict') {
    // In strict mode: 100% of words must match if totalWords <= 5.
    // If long verse (> 5 words), must match at least 95% of words AND overall similarity >= 0.85.
    isCorrect = totalWords <= 5 
      ? matchedCount === totalWords && bestSimilarity >= 0.82
      : wordRatio >= 0.92 && bestSimilarity >= 0.82 && matchedCount >= totalWords - 1;
  } else if (sensitivity === 'standard') {
    isCorrect = totalWords <= 3
      ? matchedCount === totalWords && bestSimilarity >= 0.75
      : wordRatio >= 0.85 && bestSimilarity >= 0.75;
  } else {
    // Lenient mode (for young children)
    isCorrect = wordRatio >= 0.75 && bestSimilarity >= 0.65;
  }

  // Calculate clean score
  const score = Math.round(Math.min(100, Math.max(0, (wordRatio * 0.7 + bestSimilarity * 0.3) * 100)));

  let feedbackMessage = '';
  if (isCorrect) {
    feedbackMessage = '🌟 Masya Allah! Seluruh lafadz ayat tepat, tartil & fasih. Ayat terbuka dan lanjut! 🔓';
  } else {
    if (firstWrongIndex !== -1 && rawWords[firstWrongIndex]) {
      const wrongWord = rawWords[firstWrongIndex];
      feedbackMessage = `⛔ Kata ke-${firstWrongIndex + 1} ("${wrongWord}") keliru atau belum terbaca. Harap baca seluruh ayat dengan teliti dari awal sampai akhir!`;
    } else if (spokenWordTokens.length < totalWords) {
      feedbackMessage = `⚠️ Bacaan belum selesai (${spokenWordTokens.length}/${totalWords} kata terdeteksi). Harap bacakan ayat sampai tuntas!`;
    } else {
      feedbackMessage = '⚠️ Ada huruf atau kata yang belum sesuai makhraj. Silakan ulangi ayat ini dengan benar untuk membuka ayat berikutnya!';
    }
  }

  return {
    isCorrect,
    score,
    matchedCount,
    totalWords,
    wordStatuses,
    feedbackMessage,
    errorDetail,
  };
}

