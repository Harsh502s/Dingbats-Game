'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function JoinPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${roomId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      localStorage.setItem(`dingbats_player_${roomId}`, data.playerId);
      router.push(`/room/${roomId}/play`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Join Game</h1>
          <p className="text-gray-500">Enter your name to join the room</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <Input 
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={20}
          />

          {error && <div className="text-sm text-red-500 text-center">{error}</div>}

          <Button type="submit" className="w-full" loading={loading} disabled={!name.trim()}>
            Join Game
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
