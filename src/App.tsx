/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlayersScreen } from './components/PlayersScreen';
import { FixturesScreen } from './components/FixturesScreen';
import { MyTeamScreen } from './components/MyTeamScreen';
import { FplManagerScreen } from './components/FplManagerScreen';
import { LandingPage } from './components/LandingPage';
import { AuthDialog } from './components/AuthDialog';
import { supabase } from './lib/supabase';
import type { FplEntry } from './types/football';

const ENTRY_STORAGE_KEY = 'playxi-fpl-entry-id';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('landing');
  const [entry, setEntry] = useState<FplEntry | null>(null);
  const [entryId, setEntryId] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    const savedEntryId = window.localStorage.getItem(ENTRY_STORAGE_KEY);
    if (savedEntryId) setEntryId(savedEntryId);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  return <>
    {activeScreen === 'landing' ? <LandingPage onOpenPlanner={() => setActiveScreen('myteam')} onSignIn={() => setAuthDialogOpen(true)} authUserEmail={authUser?.email ?? null} /> : (
    <div className="flex min-h-screen flex-col bg-[#051424] font-sans text-white">
      <Header
        entry={entry}
        entryId={entryId}
        authUser={authUser}
        onOpenAccount={() => setAuthDialogOpen(true)}
        activeScreen={activeScreen}
        onOpenSearch={() => setActiveScreen('players')}
        onReturnHome={() => setActiveScreen('landing')}
        onNavigate={setActiveScreen}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#051424] pb-20 md:pb-0">
          {activeScreen === 'myteam' && <MyTeamScreen userId={authUser?.id ?? null} onBrowsePlayers={() => setActiveScreen('players')} onBrowseFixtures={() => setActiveScreen('fixtures')} onEntryLoaded={handleEntryLoaded} />}
          {activeScreen === 'players' && <PlayersScreen />}
          {activeScreen === 'fixtures' && <FixturesScreen />}
          {activeScreen === 'manager' && <FplManagerScreen entry={entry} entryId={entryId} onOpenMyTeam={() => setActiveScreen('myteam')} />}
        </main>
      </div>
    </div>
    )}
    <AuthDialog open={authDialogOpen} user={authUser} onClose={() => setAuthDialogOpen(false)} onSignedOut={() => setAuthUser(null)} />
  </>;
}
