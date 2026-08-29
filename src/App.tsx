/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KafaProvider, useKafa } from './context/KafaContext';
import { Navbar } from './components/Navbar';
import { ChildBottomNav, ChildTab } from './components/ChildBottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { KafaAssistantModal } from './components/KafaAssistantModal';
import { SetorHafalanModal } from './views/SetorHafalanModal';
import { VoiceRecitationGateModal } from './components/VoiceRecitationGateModal';
import { ChildDashboard } from './views/ChildDashboard';
import { QuranLibrary } from './views/QuranLibrary';
import { SurahDetailView } from './views/SurahDetailView';
import { StudyAyahMode } from './views/StudyAyahMode';
import { MurajaahView } from './views/MurajaahView';
import { MiniGamesView } from './views/MiniGamesView';
import { AchievementsView } from './views/AchievementsView';
import { ChildProfileView } from './views/ChildProfileView';
import { ParentDashboard } from './views/ParentDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { Ayah, Surah, getSurahById, JUZ_30_SURAHS } from './data/quranData';

const MainAppContent: React.FC = () => {
  const { role, activeProfile } = useKafa();

  // Child View state
  const [childTab, setChildTab] = useState<ChildTab>('beranda');
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [focusAyahNumber, setFocusAyahNumber] = useState<number | null>(null);

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [setorModalData, setSetorModalData] = useState<{ surah: Surah; ayah: Ayah } | null>(null);

  // Voice Gate Modal state
  const [isVoiceGateOpen, setIsVoiceGateOpen] = useState(false);
  const [voiceGateSurahId, setVoiceGateSurahId] = useState<number>(114);
  const [voiceGateAyahNumber, setVoiceGateAyahNumber] = useState<number>(1);
  const [voiceGateJuz, setVoiceGateJuz] = useState<number>(30);

  const handleOpenVoiceGate = (surahId?: number, ayahNumber?: number, juzNumber?: number) => {
    const targetSurahId = surahId || selectedSurahId || activeProfile.currentSurahId || 114;
    setVoiceGateSurahId(targetSurahId);
    setVoiceGateAyahNumber(ayahNumber || 1);
    setVoiceGateJuz(juzNumber || (targetSurahId >= 78 ? 30 : 1));
    setIsVoiceGateOpen(true);
  };

  const handleOpenSurah = (surahId: number) => {
    setSelectedSurahId(surahId);
    setFocusAyahNumber(null);
    setChildTab('hafalan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFocusStudy = (surahId: number, ayahNumber: number) => {
    setSelectedSurahId(surahId);
    setFocusAyahNumber(ayahNumber);
    setChildTab('hafalan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSurahList = () => {
    setSelectedSurahId(null);
    setFocusAyahNumber(null);
  };

  const handleBackToSurahDetail = () => {
    setFocusAyahNumber(null);
  };

  const handleOpenSetor = (surah: Surah, ayah: Ayah) => {
    setSetorModalData({ surah, ayah });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenVoiceGate={handleOpenVoiceGate}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {role === 'parent' ? (
          <ParentDashboard />
        ) : role === 'admin' ? (
          <AdminDashboard />
        ) : (
          /* CHILD ROLE VIEWS */
          <>
            {childTab === 'beranda' && (
              <ChildDashboard
                onNavigateTab={(tab) => setChildTab(tab)}
                onOpenSurah={handleOpenSurah}
                onOpenFocusStudy={handleOpenFocusStudy}
                onOpenAssistant={() => setIsAssistantOpen(true)}
                onOpenVoiceGate={handleOpenVoiceGate}
              />
            )}

            {childTab === 'hafalan' && (
              <>
                {selectedSurahId && focusAyahNumber ? (
                  <StudyAyahMode
                    surahId={selectedSurahId}
                    ayahNumber={focusAyahNumber}
                    onBack={handleBackToSurahDetail}
                    onNavigateAyah={(newAyah) => setFocusAyahNumber(newAyah)}
                    onOpenSetorModal={handleOpenSetor}
                    onOpenVoiceGate={handleOpenVoiceGate}
                  />
                ) : selectedSurahId ? (
                  <SurahDetailView
                    surahId={selectedSurahId}
                    onBack={handleBackToSurahList}
                    onSelectSurah={handleOpenSurah}
                    onOpenFocusStudy={(sId, aNum) => handleOpenFocusStudy(sId, aNum)}
                    onOpenSetorModal={handleOpenSetor}
                    onOpenVoiceGate={handleOpenVoiceGate}
                  />
                ) : (
                  <QuranLibrary onSelectSurah={handleOpenSurah} />
                )}
              </>
            )}

            {childTab === 'murajaah' && (
              <MurajaahView
                onOpenSurah={handleOpenSurah}
                onOpenFocusStudy={handleOpenFocusStudy}
              />
            )}

            {childTab === 'games' && <MiniGamesView onOpenVoiceGate={handleOpenVoiceGate} />}

            {childTab === 'prestasi' && <AchievementsView />}

            {childTab === 'profil' && <ChildProfileView />}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Child Mode */}
      {role === 'child' && (
        <ChildBottomNav
          activeTab={childTab}
          onSelectTab={(tab) => {
            setChildTab(tab);
            if (tab !== 'hafalan') {
              setSelectedSurahId(null);
              setFocusAyahNumber(null);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* MODALS */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <KafaAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      <VoiceRecitationGateModal
        isOpen={isVoiceGateOpen}
        initialSurahId={voiceGateSurahId}
        initialAyahNumber={voiceGateAyahNumber}
        initialJuz={voiceGateJuz}
        onClose={() => setIsVoiceGateOpen(false)}
      />

      {setorModalData && (
        <SetorHafalanModal
          isOpen={Boolean(setorModalData)}
          surah={setorModalData.surah}
          ayah={setorModalData.ayah}
          onClose={() => setSetorModalData(null)}
          onSuccess={() => {
            // refreshed context
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <KafaProvider>
      <MainAppContent />
    </KafaProvider>
  );
}
