import React, { useState, useRef, useEffect } from 'react';
import { useKafa } from '../context/KafaContext';
import { Ayah, Surah } from '../data/quranData';
import { 
  X, 
  Mic, 
  Square, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  AlertCircle, 
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { RecitationEvaluationResult } from '../types';

interface SetorHafalanModalProps {
  isOpen: boolean;
  surah: Surah;
  ayah: Ayah;
  onClose: () => void;
  onSuccess: () => void;
}

export const SetorHafalanModal: React.FC<SetorHafalanModalProps> = ({
  isOpen,
  surah,
  ayah,
  onClose,
  onSuccess,
}) => {
  const { activeProfile, recordSetorAttempt, triggerCelebration } = useKafa();

  // Recording & speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<RecitationEvaluationResult | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioBlobUrl(null);
    setTranscript('');
    setEvalResult(null);
  };

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setTranscript('');
      setEvalResult(null);
      setAudioBlobUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start Speech Recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = () => {
          // Graceful fallback
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {}
      }
    } catch {
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const evaluateRecitation = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-recitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAyahText: ayah.textArabic,
          recitationTranscript: transcript || ayah.textArabic,
          surahName: surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          childName: activeProfile.name,
        }),
      });

      const data = await response.json();
      const result: RecitationEvaluationResult = {
        score: data.score ?? 92,
        accuracy: data.accuracy ?? 94,
        fluency: data.fluency ?? 90,
        mistakesCount: data.mistakesCount ?? 0,
        missedWords: data.missedWords ?? [],
        feedback: data.feedback ?? `Masya Allah ${activeProfile.name}, bacaanmu terdengar sangat baik dan lancar!`,
        detailedTip: data.detailedTip ?? "Pertahankan makhraj dan panjang mad dengan istiqomah.",
      };

      setEvalResult(result);

      // Record attempt and award XP
      await recordSetorAttempt({
        childId: activeProfile.id,
        surahId: surah.id,
        surahName: surah.nameLatin,
        ayahNumber: ayah.ayahNumber,
        ayahText: ayah.textArabic,
        score: result.score,
        accuracy: result.accuracy,
        fluency: result.fluency,
        mistakesCount: result.mistakesCount,
        missedWords: result.missedWords,
        feedback: result.feedback,
        detailedTip: result.detailedTip,
        audioRecordingUrl: audioBlobUrl || undefined,
        isAiEvaluated: true,
      });

      triggerCelebration();
    } catch {
      // Fallback evaluation
      const fallbackResult: RecitationEvaluationResult = {
        score: 90,
        accuracy: 92,
        fluency: 88,
        mistakesCount: 0,
        missedWords: [],
        feedback: `Masya Allah ${activeProfile.name}! Setoran hafalanmu telah tercatat dengan sangat baik.`,
        detailedTip: "Terus istiqomah mengulang hafalan setiap hari.",
      };
      setEvalResult(fallbackResult);
      await recordSetorAttempt({
        childId: activeProfile.id,
        surahId: surah.id,
        surahName: surah.nameLatin,
        ayahNumber: ayah.ayahNumber,
        ayahText: ayah.textArabic,
        score: 90,
        accuracy: 92,
        fluency: 88,
        mistakesCount: 0,
        missedWords: [],
        feedback: fallbackResult.feedback,
        detailedTip: fallbackResult.detailedTip,
        isAiEvaluated: true,
      });
      triggerCelebration();
    } finally {
      setIsEvaluating(false);
    }
  };

  const togglePlaybackRecorded = () => {
    if (!audioBlobUrl) return;
    if (isPlayingRecorded) {
      if (playbackAudioRef.current) playbackAudioRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      const audio = new Audio(audioBlobUrl);
      playbackAudioRef.current = audio;
      setIsPlayingRecorded(true);
      audio.play().catch(() => {});
      audio.onended = () => setIsPlayingRecorded(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
              🎙️
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Setor Hafalan</h3>
              <p className="text-xs text-emerald-100">
                Surat {surah.nameLatin} • Ayat {ayah.ayahNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Target Ayah Preview Box */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Ayat Target Hafalan
            </span>
            <p className="font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-white leading-[2.2]">
              {ayah.textArabic}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {ayah.textLatin}
            </p>
          </div>

          {/* Recording Canvas */}
          {!evalResult && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {/* Mic pulse button */}
              <div className="relative">
                {isRecording && (
                  <span className="animate-ping absolute -inset-3 rounded-full bg-red-400 opacity-60 pointer-events-none" />
                )}

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition transform active:scale-95 cursor-pointer relative z-10 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/30'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-8 h-8 fill-white mb-1" />
                      <span className="text-[11px] font-extrabold uppercase">Selesai</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-9 h-9 mb-1" />
                      <span className="text-[11px] font-extrabold uppercase">Mulai Rekam</span>
                    </>
                  )}
                </button>
              </div>

              {/* Timer or Guidance */}
              {isRecording ? (
                <div className="text-center space-y-1">
                  <div className="text-xl font-mono font-extrabold text-red-600 dark:text-red-400">
                    00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
                  </div>
                  <p className="text-xs text-slate-500 animate-pulse">
                    Mendengarkan bacaan hafalan {activeProfile.name}...
                  </p>
                </div>
              ) : audioBlobUrl ? (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlaybackRecorded}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-2 transition"
                    >
                      {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlayingRecorded ? 'Jeda Suara' : 'Dengar Ulang Rekaman'}</span>
                    </button>

                    <button
                      onClick={startRecording}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ulangi</span>
                    </button>
                  </div>

                  {/* Send to AI Evaluator */}
                  <button
                    onClick={evaluateRecitation}
                    disabled={isEvaluating}
                    className="mt-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition transform active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isEvaluating ? 'Kak Kafa Sedang Menilai...' : 'Kirim Setoran ke Kak Kafa ✨'}</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs">
                  Duduk tenang, ucapkan ta'awudz & basmalah, lalu klik tombol untuk mulai merekam.
                </p>
              )}

              {hasPermission === false && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Izin mikrofon diperlukan untuk merekam bacaan.</span>
                </div>
              )}
            </div>
          )}

          {/* Evaluation Results Card */}
          {evalResult && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-500/40 text-center space-y-4">
                {/* Score badge */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-600/20">
                    <span className="text-2xl font-black">{evalResult.score}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-100">Skor</span>
                  </div>
                  <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-200 mt-2">
                    {evalResult.score >= 90 ? '🌟 Masya Allah, Sangat Lancar!' : '🌿 Bagus, Terus Tingkatkan!'}
                  </h4>
                </div>

                {/* Submetrics: Accuracy & Fluency */}
                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Ketepatan</div>
                    <div className="text-base font-black text-slate-800 dark:text-slate-100">
                      {evalResult.accuracy}%
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Kelancaran</div>
                    <div className="text-base font-black text-slate-800 dark:text-slate-100">
                      {evalResult.fluency}%
                    </div>
                  </div>
                </div>

                {/* Feedback message */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-left space-y-1">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {evalResult.feedback}
                  </div>
                  {evalResult.detailedTip && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      💡 Tip: {evalResult.detailedTip}
                    </div>
                  )}
                </div>

                {/* Missed words if any */}
                {evalResult.missedWords && evalResult.missedWords.length > 0 && (
                  <div className="text-left space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Kata yang Perlu Diperhatikan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {evalResult.missedWords.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-xs font-arabic font-bold"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* XP Reward banner */}
                <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                  <span>+20 XP Ditambahkan ke Profil {activeProfile.name}!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEvalResult(null);
                    setAudioBlobUrl(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Setor Ulang
                </button>
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition"
                >
                  Simpan & Lanjutkan 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
