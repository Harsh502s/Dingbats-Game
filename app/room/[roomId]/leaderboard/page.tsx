'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { LeaderboardRow } from '@/components/ui/LeaderboardRow';
import { Button } from '@/components/ui/Button';

export default function LeaderboardPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { room, players } = useRoomChannel(roomId);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const hostId = localStorage.getItem('dingbats_host_id');
    const playerId = localStorage.getItem(`dingbats_player_${roomId}`);
    setIsHost(!!hostId);
    setCurrentPlayerId(playerId);
  }, [roomId]);

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

      <div className="flex justify-center space-x-4">
        {isHost && (
          <Button onClick={() => router.push('/')} className="px-8 py-4 text-lg">
            Create New Game
          </Button>
        )}
      </div>
    </main>
  );
}
