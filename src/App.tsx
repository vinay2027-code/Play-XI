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
import { DashboardScreen } from './components/DashboardScreen';
import { MatchCentreScreen } from './components/MatchCentreScreen';
import { supabase } from './lib/supabase';
import type { FplEntry } from './types/football';

const ENTRY_STORAGE_KEY = 'playxi-fpl-entry-id';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('landing');
  const [entry, setEntry] = useState<FplEntry | null>(null);
  const [entryId, setEntryId] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authCallbackError, setAuthCallbackError] = useState('');
  const [compareIds, setCompareIds] = useState<number[]>([]);

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ''),
    );
    const hasHashAuthError =
      hashParams.has('error') || hashParams.has('error_description');
    const callbackError =
      searchParams.has('error') ||
      searchParams.has('error_description') ||
      hasHashAuthError;
    if (!callbackError) return;

    setAuthCallbackError(
      'Google sign-in was cancelled or could not be completed. Try again or use email sign-in.',
    );
    setAuthDialogOpen(true);

    for (const key of ['error', 'error_code', 'error_description']) {
      searchParams.delete(key);
      hashParams.delete(key);
    }
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    if (hasHashAuthError) {
      url.hash = hashParams.toString();
    }
    window.history.replaceState(null, document.title, url);
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

  const handleEntryLoaded = (
    nextEntry: FplEntry | null,
    nextEntryId: string,
  ) => {
    setEntry(nextEntry);
    setEntryId(nextEntryId);
  };

  return (
    <>
      {activeScreen === 'landing' ? (
        <LandingPage
          onOpenPlanner={() => setActiveScreen('myteam')}
          onOpenOverview={() => setActiveScreen('dashboard')}
          onOpenMatchCentre={() => setActiveScreen('matchcentre')}
          onSignIn={() => setAuthDialogOpen(true)}
          authUserEmail={authUser?.email ?? null}
        />
      ) : (
        <div className="playxi-workspace flex min-h-screen flex-col font-sans">
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
            <main
              className={`min-w-0 flex-1 pb-20 md:pb-0 ${['myteam', 'fixtures', 'manager'].includes(activeScreen) ? 'sport-planner-surface' : ''}`}
            >
              {activeScreen === 'dashboard' && (
                <DashboardScreen
                  entry={entry}
                  onNavigate={setActiveScreen}
                  onCompare={(id) => {
                    setCompareIds((current) =>
                      current.includes(id)
                        ? current
                        : [...current.slice(-1), id],
                    );
                    setActiveScreen('players');
                  }}
                />
              )}
              {activeScreen === 'myteam' && (
                <MyTeamScreen
                  userId={authUser?.id ?? null}
                  onBrowsePlayers={() => setActiveScreen('players')}
                  onBrowseFixtures={() => setActiveScreen('fixtures')}
                  onEntryLoaded={handleEntryLoaded}
                />
              )}
              {activeScreen === 'players' && (
                <PlayersScreen
                  compareIds={compareIds}
                  onCompareChange={setCompareIds}
                />
              )}
              {activeScreen === 'fixtures' && <FixturesScreen />}
              {activeScreen === 'matchcentre' && <MatchCentreScreen />}
              {activeScreen === 'manager' && (
                <FplManagerScreen
                  entry={entry}
                  entryId={entryId}
                  onOpenMyTeam={() => setActiveScreen('myteam')}
                />
              )}
            </main>
          </div>
        </div>
      )}
      <AuthDialog
        open={authDialogOpen}
        user={authUser}
        callbackError={authCallbackError}
        onClose={() => setAuthDialogOpen(false)}
        onSignedOut={() => setAuthUser(null)}
      />
    </>
  );
}
