export type RoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type Player = {
  id: string;
  name: string;
  score: number;
  is_kicked: boolean;
};

export type Room = {
  id: string;
  host_id: string;
  status: RoomStatus;
  current_round: number;
  total_rounds: number;
  round_started_at: string | null;
  round_duration: number;
};

export type GuessEntry = {
  id: string;
  playerId: string;
  playerName: string;
  correct: boolean;
  guessText?: string;
  points?: number;
};
