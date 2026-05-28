'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { Button } from '@/components/ui/Button';
import { PlayerList } from '@/components/ui/PlayerList';
import { PuzzleCard } from '@/components/ui/PuzzleCard';
import { CopyLink } from '@/components/ui/CopyLink';
import { GuessFeed, GuessEntry } from '@/components/ui/GuessFeed';
import { LeaderboardRow } from '@/components/ui/LeaderboardRow';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { PuzzleUploader } from '@/components/ui/PuzzleUploader';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase/client';

export default function HostPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, players, currentPuzzleUrl, uploadedCount, guesses, setGuesses, typing, error, notFound: roomNotFound } = useRoomChannel(roomId);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [availablePacks, setAvailablePacks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'custom' | 'library' | 'create'>('custom');
  const [newPackName, setNewPackName] = useState('');

  const fetchPacks = useCallback(async () => {
    try {
      const res = await fetch('/api/packs');
      const data = await res.json();
      if (data.packs) {
        setAvailablePacks(data.packs);
        // Auto-select first pack only when in library tab with nothing selected
        if (activeTab === 'library' && !selectedPack && data.packs.length > 0) {
          setSelectedPack(data.packs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch packs:', err);
    }
  }, [activeTab, selectedPack]);

  const handleDeletePack = async (e: React.MouseEvent, packName: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the pack "${packName}"? This cannot be undone.`)) return;

    try {
      const res = await fetch('/api/packs/delete', {
        method: 'DELETE',
        headers: { 'x-host-token': hostToken!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ packName })
      });
      if (res.ok) {
        if (selectedPack === packName) {
          setSelectedPack(null);
        }
        await fetchPacks();
      } else {
        const data = await res.json();
        alert(`Failed to delete pack: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting pack');
    }
  };

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  // Reset form when leaving create tab
  useEffect(() => {
    if (activeTab !== 'create') {
      setNewPackName('');
    }
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem(`dingbats_host_token_${roomId}`);
    setHostToken(token);
    if (!token) {
      router.push('/');
    } else {
      // Set cookie for middleware route guard
      document.cookie = `dingbats_host_token_${roomId}=${token}; path=/; max-age=86400`;
    }
  }, [router, roomId]);

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      router.push(`/room/${roomId}/leaderboard`);
    }
  }, [room?.status, router, roomId]);

  // Guesses now managed by useRoomChannel

  if (roomNotFound) {
    notFound();
  }

  if (error) {
    throw error;
  }

  // Define all hooks BEFORE any conditional returns
  const handleStart = useCallback(async () => {
    setLoading(true);
    setFormError('');
    const res = await fetch(`/api/rooms/${roomId}/start`, {
      method: 'POST',
      headers: { 'x-host-token': hostToken!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ packName: selectedPack })
    });
    const data = await res.json();
    if (!res.ok) setFormError(data.error);
    setLoading(false);
  }, [roomId, hostToken, selectedPack]);

  const handleNextRound = useCallback(async () => {
    if (loading) return;
    setIsPaused(false);
    setLoading(true);
    setGuesses([]);
    const res = await fetch(`/api/rooms/${roomId}/next-round`, {
      method: 'POST',
      headers: { 'x-host-token': hostToken! }
    });
    await res.json();
    setLoading(false);
  }, [roomId, hostToken, loading]);

  const handleKick = useCallback(async (playerId: string) => {
    await fetch(`/api/rooms/${roomId}/players/${playerId}`, {
      method: 'DELETE',
      headers: { 'x-host-token': hostToken! }
    });
  }, [roomId, hostToken]);

  // Auto-advance when all players have guessed
  useEffect(() => {
    if (!room || room.status !== 'PLAYING' || loading) return;

    const uniqueGuessers = new Set(guesses.map(g => g.playerId));
    const activePlayers = players.filter(p => !p.is_kicked);

    if (activePlayers.length > 0 && uniqueGuessers.size === activePlayers.length) {
      handleNextRound();
    }
  }, [guesses, players, room, loading, handleNextRound]);

  // NOW conditional returns are safe
  if (!room || !hostToken) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (room.status === 'FINISHED') return null;



  if (room.status === 'LOBBY') {
    const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}/join` : '';

    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-8 relative">
        <Button
          variant="secondary"
          className="absolute top-4 left-4"
          onClick={() => router.push('/')}
        >
          ← Home
        </Button>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-6 mt-12">
          <h1 className="text-3xl font-bold">Room Lobby</h1>
          <p className="text-gray-500">Share this link with players to join</p>
          <div className="max-w-md mx-auto">
            <CopyLink url={joinUrl} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Choose Puzzles</h2>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'custom' ? 'bg-white shadow-sm text-brand-500' : 'text-gray-500'}`}
              >
                Custom Room Puzzles
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-white shadow-sm text-brand-500' : 'text-gray-500'}`}
              >
                Library Packs
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-white shadow-sm text-brand-500' : 'text-gray-500'}`}
              >
                Create New Pack
              </button>
            </div>
          </div>

          {/* Custom Room Puzzles */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Upload puzzles specifically for this game session. They won't be saved to the library.</p>
              <PuzzleUploader
                uploadType="room"
                roomId={roomId}
                hostToken={hostToken!}
                uploadedCount={uploadedCount}
                totalRounds={room.total_rounds}
              />
            </div>
          )}

          {/* Select from Library */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              {availablePacks.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availablePacks.map(p => (
                      <div
                        key={p}
                        onClick={() => setSelectedPack(p)}
                        className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 group relative overflow-hidden cursor-pointer
                          ${selectedPack === p
                            ? 'border-brand-500 bg-orange-50 ring-4 ring-orange-50'
                            : 'border-gray-100 bg-white hover:border-brand-300 hover:bg-gray-50'}`}
                      >
                        <div className="flex flex-col h-full justify-between relative z-10">
                          <div className="flex justify-between items-start">
                            <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors
                              ${selectedPack === p ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-500'}`}>
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeletePack(e, p)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all relative z-20"
                              title="Delete Pack"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg mb-1 ${selectedPack === p ? 'text-brand-600' : 'text-gray-700'}`}>{p}</h3>
                            <p className="text-xs text-gray-400">Library Pack</p>
                          </div>

                          {selectedPack === p && (
                            <div className="mt-4 flex items-center text-xs font-bold text-brand-500 uppercase tracking-widest">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              Selected
                            </div>
                          )}
                        </div>

                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-110">
                          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500 italic">Note: Library packs override custom puzzles.</p>
                    <div className="text-xs font-semibold text-brand-500 bg-orange-100 px-3 py-1 rounded-full">{availablePacks.length} Packs</div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 mb-4">No library packs found</p>
                  <Button variant="secondary" onClick={() => setActiveTab('create')}>Create Your First Pack</Button>
                </div>
              )}
            </div>
          )}

          {/* Create New Pack */}
          {activeTab === 'create' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Pack Name</label>
                <input
                  type="text"
                  placeholder="e.g. Science Dingbats, My Colleagues Pack..."
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {newPackName && newPackName.trim().length < 3 && (
                  <p className="text-xs text-red-500 font-medium">Pack name must be at least 3 characters</p>
                )}
              </div>

              {newPackName.trim().length >= 3 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Add Puzzles to "{newPackName}"</h3>
                    <p className="text-xs text-gray-400">Puzzles will be saved to library immediately</p>
                  </div>
                  <PuzzleUploader
                    uploadType="pack"
                    packName={newPackName}
                    hostToken={hostToken!}
                    onUploadComplete={() => {
                      fetchPacks();
                    }}
                  />
                  <div className="flex justify-end">
                    <Button variant="secondary" onClick={() => { setActiveTab('library'); setSelectedPack(newPackName); }}>
                      Finished Creating Pack
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                  Enter a pack name above to start adding puzzles
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Players ({players.length})</h2>
          </div>
          <PlayerList players={players} onKick={handleKick} />
        </div>

        {formError && <div className="text-center text-red-500">{formError}</div>}

        <div className="flex justify-center pb-8">
          <Button onClick={handleStart} loading={loading} disabled={players.length === 0 || (!selectedPack && uploadedCount < room.total_rounds)} className="px-8 py-4 text-lg">
            Start Game
          </Button>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative pt-20 lg:pt-8">
      <Button
        variant="secondary"
        className="absolute top-4 left-4 lg:hidden"
        onClick={() => router.push('/')}
      >
        ← Home
      </Button>
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              className="hidden lg:block mr-4"
              onClick={() => router.push('/')}
            >
              ← Home
            </Button>
            <h1 className="text-2xl font-bold">Round {room.current_round} of {room.total_rounds}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <CountdownTimer
              startedAt={room.round_started_at}
              duration={room.round_duration}
              paused={isPaused}
              onExpire={handleNextRound}
            />
            <button
              onClick={() => setIsPaused(p => !p)}
              title={isPaused ? 'Resume' : 'Pause'}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors text-lg
                ${isPaused
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
            <Button onClick={handleNextRound} loading={loading}>
              {room.current_round === room.total_rounds ? 'End Game' : 'Skip Round'}
            </Button>
          </div>
        </div>

        <PuzzleCard imageUrl={cloudinaryUrl(currentPuzzleUrl || '', 800)} />
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Live Guess Log</h2>
          <GuessFeed guesses={guesses} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Leaderboard</h2>
          <div className="space-y-2">
            {players.map((p, i) => (
              <LeaderboardRow key={p.id} player={p} rank={i + 1} isCurrentUser={false} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
