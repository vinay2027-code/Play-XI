/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardScreen } from './components/DashboardScreen';
import { BuildXIScreen } from './components/BuildXIScreen';
import { PlayersScreen } from './components/PlayersScreen';
import { FixturesScreen } from './components/FixturesScreen';
import { MyTeamScreen } from './components/MyTeamScreen';
import { TransfersScreen } from './components/TransfersScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LandingPage } from './components/LandingPage';
import {
  CompareModal,
  SimulationModal,
  SwapPlayerModal,
} from './components/Modals';
import {
  INITIAL_USER,
  ALL_PLAYERS,
  TACTICAL_INSIGHTS,
} from './data/mockData';
import { Player, ActiveUser } from './types/fpl';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<string>('myteam');
  const [user, setUser] = useState<ActiveUser>(INITIAL_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Modals state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparedPlayers, setComparedPlayers] = useState<[Player, Player]>([
    ALL_PLAYERS.find((p) => p.id === 'halvorsen') || ALL_PLAYERS[0],
    ALL_PLAYERS.find((p) => p.id === 'isak') || ALL_PLAYERS[5],
  ]);

  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [playerToSwap, setPlayerToSwap] = useState<Player | undefined>(undefined);

  // Global squad state
  const [startingXI, setStartingXI] = useState<{
    gk: Player[];
    def: Player[];
    mid: Player[];
    fwd: Player[];
  }>({
    gk: [ALL_PLAYERS.find((p) => p.id === 'raya') || ALL_PLAYERS[10]],
    def: [
      ALL_PLAYERS.find((p) => p.id === 'gabriel') || ALL_PLAYERS[8],
      ALL_PLAYERS.find((p) => p.id === 'gvardiol') || ALL_PLAYERS[15],
      ALL_PLAYERS.find((p) => p.id === 'porro') || ALL_PLAYERS[16],
    ],
    mid: [
      ALL_PLAYERS.find((p) => p.id === 'saka') || ALL_PLAYERS[12],
      ALL_PLAYERS.find((p) => p.id === 'palmer') || ALL_PLAYERS[1],
      ALL_PLAYERS.find((p) => p.id === 'salah') || ALL_PLAYERS[13],
      ALL_PLAYERS.find((p) => p.id === 'debruyne') || ALL_PLAYERS[14],
    ],
    fwd: [
      ALL_PLAYERS.find((p) => p.id === 'isak') || ALL_PLAYERS[5],
      ALL_PLAYERS.find((p) => p.id === 'halvorsen') || ALL_PLAYERS[0],
      ALL_PLAYERS.find((p) => p.id === 'watkins') || ALL_PLAYERS[17],
    ],
  });

  const [bench, setBench] = useState<Player[]>([
    ALL_PLAYERS.find((p) => p.id === 'fabianski') || ALL_PLAYERS[21],
    ALL_PLAYERS.find((p) => p.id === 'taylor') || ALL_PLAYERS[22],
    ALL_PLAYERS.find((p) => p.id === 'winks') || ALL_PLAYERS[23],
    ALL_PLAYERS.find((p) => p.id === 'fraser') || ALL_PLAYERS[24],
  ]);

  // Keyboard shortcut listener for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveScreen('players');
      }
      if (e.key === 'Escape') {
        setCompareModalOpen(false);
        setSimulationModalOpen(false);
        setSwapModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleOpenCompare = (p1?: Player, p2?: Player) => {
    const player1 = p1 || comparedPlayers[0];
    const player2 = p2 || (p1 && p1.id === comparedPlayers[0].id ? comparedPlayers[1] : comparedPlayers[1]);
    setComparedPlayers([player1, player2]);
    setCompareModalOpen(true);
  };

  const handleOpenSwap = (player?: Player) => {
    setPlayerToSwap(player);
    setSwapModalOpen(true);
  };

  const handleSelectPlayerForDetail = (player: Player) => {
    handleOpenCompare(player, comparedPlayers[0].id === player.id ? comparedPlayers[1] : comparedPlayers[0]);
  };

  const handleSwapReplacement = (replacement: Player) => {
    if (!playerToSwap) return;
    
    // Replace in starting XI
    const roleKey = playerToSwap.role.toLowerCase() as 'gk' | 'def' | 'mid' | 'fwd';
    setStartingXI((prev) => ({
      ...prev,
      [roleKey]: prev[roleKey].map((p) => (p.id === playerToSwap.id ? replacement : p)),
    }));
  };

  const handleAutoPick = () => {
    // Automatically pick highest xPts squad
    setStartingXI({
      gk: [ALL_PLAYERS.find((p) => p.id === 'vance') || ALL_PLAYERS[20]],
      def: [
        ALL_PLAYERS.find((p) => p.id === 'avenel') || ALL_PLAYERS[18],
        ALL_PLAYERS.find((p) => p.id === 'castille') || ALL_PLAYERS[19],
        ALL_PLAYERS.find((p) => p.id === 'romero') || ALL_PLAYERS[20],
      ],
      mid: [
        ALL_PLAYERS.find((p) => p.id === 'debruyne') || ALL_PLAYERS[14],
        ALL_PLAYERS.find((p) => p.id === 'nordin') || ALL_PLAYERS[17],
        ALL_PLAYERS.find((p) => p.id === 'saka') || ALL_PLAYERS[12],
        ALL_PLAYERS.find((p) => p.id === 'kudus') || ALL_PLAYERS[18],
      ],
      fwd: [
        ALL_PLAYERS.find((p) => p.id === 'halvorsen') || ALL_PLAYERS[0],
        ALL_PLAYERS.find((p) => p.id === 'watkins') || ALL_PLAYERS[15],
        ALL_PLAYERS.find((p) => p.id === 'isak') || ALL_PLAYERS[5],
      ],
    });
  };

  const handleResetSquad = () => {
    setStartingXI({
      gk: [ALL_PLAYERS.find((p) => p.id === 'raya') || ALL_PLAYERS[10]],
      def: [
        ALL_PLAYERS.find((p) => p.id === 'gabriel') || ALL_PLAYERS[8],
        ALL_PLAYERS.find((p) => p.id === 'gvardiol') || ALL_PLAYERS[15],
        ALL_PLAYERS.find((p) => p.id === 'porro') || ALL_PLAYERS[16],
      ],
      mid: [
        ALL_PLAYERS.find((p) => p.id === 'saka') || ALL_PLAYERS[12],
        ALL_PLAYERS.find((p) => p.id === 'palmer') || ALL_PLAYERS[1],
        ALL_PLAYERS.find((p) => p.id === 'salah') || ALL_PLAYERS[13],
        ALL_PLAYERS.find((p) => p.id === 'debruyne') || ALL_PLAYERS[14],
      ],
      fwd: [
        ALL_PLAYERS.find((p) => p.id === 'isak') || ALL_PLAYERS[5],
        ALL_PLAYERS.find((p) => p.id === 'halvorsen') || ALL_PLAYERS[0],
        ALL_PLAYERS.find((p) => p.id === 'watkins') || ALL_PLAYERS[17],
      ],
    });
  };

  const handleLoginSuccess = (newUser: ActiveUser) => {
    setUser(newUser);
    setIsLoggedIn(true);
    setActiveScreen('myteam');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveScreen('landing');
  };

  // If user requested Landing Page or is logged out, show Landing Page
  if (!isLoggedIn || activeScreen === 'landing') {
    return (
      <LandingPage
        currentUser={user}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#051424] text-white flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={user}
        activeScreen={activeScreen}
        onOpenSearch={() => setActiveScreen('players')}
        onLogout={handleLogout}
        onNavigate={(s) => setActiveScreen(s)}
      />

      {/* Main Layout Container: Left Sidebar + Screen Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={(s) => setActiveScreen(s)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto bg-[#051424]">
          {activeScreen === 'dashboard' && (
            <DashboardScreen
              user={user}
              onNavigate={(s) => setActiveScreen(s)}
              onOpenSimulation={() => setSimulationModalOpen(true)}
              onOpenCompare={handleOpenCompare}
              onSelectPlayer={handleSelectPlayerForDetail}
              startingXI={startingXI}
              bench={bench}
              insights={TACTICAL_INSIGHTS}
            />
          )}

          {activeScreen === 'myteam' && <MyTeamScreen onBrowsePlayers={() => setActiveScreen('players')} onBrowseFixtures={() => setActiveScreen('fixtures')} />}

          {activeScreen === 'build' && (
            <BuildXIScreen
              onOpenSimulation={() => setSimulationModalOpen(true)}
              onOpenSwapModal={handleOpenSwap}
              onSelectPlayer={handleSelectPlayerForDetail}
              startingXI={startingXI}
              bench={bench}
              onAutoPick={handleAutoPick}
              onReset={handleResetSquad}
              onSave={() => {
                setUser((prev) => ({ ...prev, activeSquadName: 'AI Optimized XI' }));
              }}
            />
          )}

          {activeScreen === 'players' && <PlayersScreen />}

          {activeScreen === 'fixtures' && <FixturesScreen />}

          {activeScreen === 'transfers' && (
            <TransfersScreen
              players={ALL_PLAYERS}
              budgetRemaining={user.budgetRemaining}
            />
          )}

          {activeScreen === 'insights' && (
            <InsightsScreen
              insights={TACTICAL_INSIGHTS}
              players={ALL_PLAYERS}
            />
          )}

          {activeScreen === 'profile' && (
            <ProfileScreen
              user={user}
              onNavigate={(s) => setActiveScreen(s)}
            />
          )}

          {activeScreen === 'settings' && (
            <ProfileScreen
              user={user}
              onNavigate={(s) => setActiveScreen(s)}
            />
          )}
        </main>
      </div>

      {/* ----------------- MODALS ----------------- */}
      {compareModalOpen && (
        <CompareModal
          player1={comparedPlayers[0]}
          player2={comparedPlayers[1]}
          onClose={() => setCompareModalOpen(false)}
        />
      )}

      {simulationModalOpen && (
        <SimulationModal
          onClose={() => setSimulationModalOpen(false)}
          onApplyOptimization={handleAutoPick}
        />
      )}

      {swapModalOpen && (
        <SwapPlayerModal
          playerToSwap={playerToSwap}
          allPlayers={ALL_PLAYERS}
          onSelectReplacement={handleSwapReplacement}
          onClose={() => setSwapModalOpen(false)}
        />
      )}

    </div>
  );
}
