import { motion } from 'framer-motion';
import { Player } from '@/lib/realtime/useRoomChannel';

interface LeaderboardRowProps {
  player: Player;
  rank: number;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ player, rank, isCurrentUser }: LeaderboardRowProps) {
  let ringColor = 'border-transparent';
  if (rank === 1) ringColor = 'border-yellow-400';
  else if (rank === 2) ringColor = 'border-gray-300';
  else if (rank === 3) ringColor = 'border-amber-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-4 rounded-xl border-2 bg-white shadow-sm ${isCurrentUser ? 'border-brand-500' : ringColor}`}
    >
      <div className="flex items-center space-x-4">
        <div className="font-bold text-xl text-gray-400 w-6 text-center">{rank}</div>
        <div className="w-10 h-10 rounded-full bg-orange-50 text-brand-500 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="font-semibold text-gray-900 text-lg">
          {player.name} {isCurrentUser && <span className="text-brand-500 text-sm ml-2">(You)</span>}
        </div>
      </div>
      <div className="font-bold text-2xl text-gray-800">
        {player.score}
      </div>
    </motion.div>
  );
}
