'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { LeaderboardRow } from '@/components/ui/LeaderboardRow';
import { Button } from '@/components/ui/Button';

import confetti from 'canvas-confetti';

export default function LeaderboardPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, players } = useRoomChannel(roomId);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // Fire confetti!
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hostId = localStorage.getItem('dingbats_host_id');
    const roomIdStored = roomId; // From params
    const playerId = localStorage.getItem(`dingbats_player_${roomIdStored}`);
    
    const hostMatched = !!hostId && room?.host_id === hostId;
    setIsHost(hostMatched);
    
    // Only identify as a player if NOT the host of this room
    if (!hostMatched) {
      setCurrentPlayerId(playerId);
    } else {
      setCurrentPlayerId(null);
    }
  }, [roomId, room?.host_id]);

  if (!room) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-12 py-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-600">
          Meoowww 🐱
        </h1>
        <p className="text-xl text-gray-500">Game Over! Here is how everyone did.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="space-y-4">
          {players.map((p, i) => (
            <LeaderboardRow 
              key={p.id} 
              player={p} 
              rank={i + 1} 
              isCurrentUser={p.id === currentPlayerId} 
            />
          ))}
          {players.length === 0 && (
            <div className="text-center text-gray-400 py-8">No players joined.</div>
          )}
        </div>
      </div>

      <div className="flex justify-center flex-col items-center space-y-6">
        {isHost ? (
          <Button onClick={() => router.push('/')} className="px-12 py-4 text-xl shadow-xl hover:scale-105 transition-transform">
            🎉 Create New Game
          </Button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Button variant="secondary" onClick={() => router.push('/')} className="px-12 py-4 text-xl">
              🏠 Back to Home
            </Button>
            <div className="bg-orange-50 text-brand-600 px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 animate-bounce">
              <span>📸</span>
              <span>Take a screenshot to save your score!</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
