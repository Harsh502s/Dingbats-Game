'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Home() {
  const router = useRouter();
  const [totalRounds, setTotalRounds] = useState(5);
  const [roundDuration, setRoundDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalRounds, roundDuration })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      localStorage.setItem(`dingbats_host_token_${data.roomId}`, data.hostToken);
      router.push(data.hostUrl);
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
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Dingbats</h1>
          <p className="text-gray-500">The real-time picture puzzle party game</p>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Number of Puzzles</label>
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={totalRounds}
                onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
              <span className="font-bold text-lg text-brand-500 w-8 text-center">{totalRounds}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Time Per Round (Seconds)</label>
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="10" 
                max="120" 
                step="5"
                value={roundDuration}
                onChange={(e) => setRoundDuration(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
              <span className="font-bold text-lg text-brand-500 w-10 text-center">{roundDuration}s</span>
            </div>
          </div>

          {error && <div className="text-sm text-red-500 text-center">{error}</div>}

          <Button type="submit" className="w-full" loading={loading}>
            Create Room
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
