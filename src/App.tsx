/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlayersScreen } from './components/PlayersScreen';
import { FixturesScreen } from './components/FixturesScreen';
import { MyTeamScreen } from './components/MyTeamScreen';
import { FplManagerScreen } from './components/FplManagerScreen';
import { LandingPage } from './components/LandingPage';
import type { FplEntry } from './types/football';

const ENTRY_STORAGE_KEY = 'playxi-fpl-entry-id';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('landing');
  const [entry, setEntry] = useState<FplEntry | null>(null);
  const [entryId, setEntryId] = useState('');

  useEffect(() => {
    const savedEntryId = window.localStorage.getItem(ENTRY_STORAGE_KEY);
    if (savedEntryId) setEntryId(savedEntryId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setActiveScreen('players');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEntryLoaded = (nextEntry: FplEntry | null, nextEntryId: string) => {
    setEntry(nextEntry);
    setEntryId(nextEntryId);
  };

  if (activeScreen === 'landing') {
    return <LandingPage onOpenPlanner={() => setActiveScreen('myteam')} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#051424] font-sans text-white">
      <Header
        entry={entry}
        entryId={entryId}
        activeScreen={activeScreen}
        onOpenSearch={() => setActiveScreen('players')}
        onReturnHome={() => setActiveScreen('landing')}
        onNavigate={setActiveScreen}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#051424] pb-20 md:pb-0">
          {activeScreen === 'myteam' && <MyTeamScreen onBrowsePlayers={() => setActiveScreen('players')} onBrowseFixtures={() => setActiveScreen('fixtures')} onEntryLoaded={handleEntryLoaded} />}
          {activeScreen === 'players' && <PlayersScreen />}
          {activeScreen === 'fixtures' && <FixturesScreen />}
          {activeScreen === 'manager' && <FplManagerScreen entry={entry} entryId={entryId} onOpenMyTeam={() => setActiveScreen('myteam')} />}
        </main>
      </div>
    </div>
  );
}
