import { Player } from '@/lib/realtime/useRoomChannel';
import { AnimatePresence, motion } from 'framer-motion';

interface PlayerListProps {
  players: Player[];
  onKick?: (playerId: string) => void;
  currentPlayerId?: string;
}

export function PlayerList({ players, onKick, currentPlayerId }: PlayerListProps) {
  return (
    <ul className="space-y-2">
      <AnimatePresence>
        {players.map(player => (
          <motion.li
            key={player.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border ${player.id === currentPlayerId ? 'border-brand-500' : 'border-gray-100'}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-brand-500 flex items-center justify-center font-bold text-sm uppercase">
                {player.name.substring(0, 2)}
              </div>
              <span className="font-medium text-gray-900">{player.name} {player.id === currentPlayerId && '(You)'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-500">{player.score} pts</span>
              {onKick && (
                <button 
                  onClick={() => onKick(player.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Kick
                </button>
              )}
            </div>
          </motion.li>
        ))}
        {players.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 text-center py-4">
            Waiting for players...
          </motion.div>
        )}
      </AnimatePresence>
    </ul>
  );
}
