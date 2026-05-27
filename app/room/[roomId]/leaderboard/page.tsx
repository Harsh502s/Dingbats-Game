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
          Dingbats Decoded!
        </h1>
        <p className="text-xl text-gray-500">Game Over! Here&apos;s how everyone did.</p>
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
          <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <Button 
                onClick={() => router.push('/')} 
                className="py-4 px-6 flex items-center justify-center space-x-2 bg-brand-500 hover:bg-brand-600 text-white shadow-md"
              >
                <span>👑</span>
                <span>Host Your Own</span>
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => window.print()}
                className="py-4 px-6 flex items-center justify-center space-x-2 border-2 border-gray-200 hover:border-brand-300"
              >
                <span>📸</span>
                <span>Take Screenshot</span>
              </Button>
            </div>
            
            <div className="bg-orange-50 text-brand-600 px-6 py-3 rounded-2xl text-sm font-bold flex items-center space-x-3 border border-orange-100 animate-pulse">
              <span className="text-xl">🏆</span>
              <span>Great game! Share your score with your colleagues.</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
