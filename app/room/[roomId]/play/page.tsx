'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PlayerList } from '@/components/ui/PlayerList';
import { PuzzleCard } from '@/components/ui/PuzzleCard';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { ScoreToast } from '@/components/ui/ScoreToast';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export default function PlayPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, players, currentPuzzleUrl, rawPlayers } = useRoomChannel(roomId);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastPoints, setToastPoints] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);

  const currentPlayer = rawPlayers?.find(p => p.id === playerId);

  useEffect(() => {
    const id = localStorage.getItem(`dingbats_player_${roomId}`);
    setPlayerId(id);
    if (!id) {
      router.push(`/room/${roomId}/join`);
    }
  }, [roomId, router]);

  useEffect(() => {
    if (room?.current_round) {
      setIsCorrect(false);
      setGuess('');
    }
  }, [room?.current_round]);

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      router.push(`/room/${roomId}/leaderboard`);
    }
  }, [room?.status, router, roomId]);

  useEffect(() => {
    if (!roomId || !playerId || !currentPlayer || isCorrect || room?.status !== 'PLAYING') return;

    const timeout = setTimeout(() => {
      const supabase = createClient();
      supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { playerId, playerName: currentPlayer.name, text: guess }
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [guess, roomId, playerId, currentPlayer, isCorrect, room?.status]);

  if (!room || !playerId) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  if (room?.status === 'FINISHED') return null;

  if (currentPlayer?.is_kicked) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center space-y-6 max-w-md w-full border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You've been removed</h1>
          <p className="text-gray-500">The host has removed you from this room.</p>
          <Button onClick={() => router.push(`/room/${roomId}/join`)} className="w-full mt-4">
            Rejoin Game
          </Button>
        </div>
      </main>
    );
  }

  if (room.status === 'LOBBY') {
    return (
      <main className="min-h-screen p-8 max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2 mt-8 mb-12">
          <div className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-2xl font-bold">Waiting for host...</h1>
          <p className="text-gray-500">The game will start shortly.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Lobby ({players.length})</h2>
          <PlayerList players={players} currentPlayerId={playerId} />
        </div>
      </main>
    );
  }

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || submitting || isCorrect) return;

    setSubmitting(true);
    const supabase = createClient();

    const res = await fetch(`/api/rooms/${roomId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, guess })
    });
    const data = await res.json();
    
    if (data.correct) {
      setIsCorrect(true);
      setToastPoints(data.points);
      setTimeout(() => setToastPoints(null), 2000);
      
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'guess',
        payload: { id: uuidv4(), playerId, playerName: currentPlayer?.name, correct: true, points: data.points }
      });
    } else {
      setShowWrong(true);
      setTimeout(() => setShowWrong(false), 1500);
      
      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'guess',
        payload: { id: uuidv4(), playerId, playerName: currentPlayer?.name, correct: false }
      });
      setGuess('');
    }
    
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto flex flex-col space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="font-bold text-gray-500">Round {room.current_round}/{room.total_rounds}</div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Score</div>
            <div className="font-bold text-xl">{currentPlayer?.score || 0}</div>
          </div>
          <CountdownTimer startedAt={room.round_started_at} duration={room.round_duration} onExpire={() => setIsCorrect(true)} />
        </div>
      </div>

      <PuzzleCard imageUrl={cloudinaryUrl(currentPuzzleUrl || '', 800)} />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        {!isCorrect ? (
          <form onSubmit={handleGuess} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full">
            <div className="flex-1">
              <Input 
                placeholder="Type your guess..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="text-xl px-4 py-3 font-medium w-full"
                autoFocus
              />
            </div>
            <Button type="submit" loading={submitting} disabled={!guess.trim()} className="px-8 text-lg py-3 whitespace-nowrap">
              Guess
            </Button>
          </form>
        ) : (
          <div className="text-center p-4 text-gray-500 font-medium">
            Waiting for next round...
          </div>
        )}
      </div>

      <ScoreToast points={toastPoints} visible={toastPoints !== null} />

      {/* Wrong answer toast */}
      <AnimatePresence>
        {showWrong && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium shadow-lg flex items-center gap-2 z-50 text-sm"
          >
            <span className="text-base">❌</span> Not quite — try again!
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
