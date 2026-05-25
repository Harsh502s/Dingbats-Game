'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Player = {
  id: string;
  name: string;
  score: number;
  is_kicked: boolean;
};

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type Room = {
  id: string;
  host_id: string;
  status: RoomStatus;
  current_round: number;
  total_rounds: number;
  round_started_at: string | null;
  round_duration: number;
};

import { GuessEntry } from '@/components/ui/GuessFeed';

export function useRoomChannel(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPuzzleUrl, setCurrentPuzzleUrl] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [typing, setTyping] = useState<Record<string, { name: string, text: string }>>({});

  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();

    const fetchInitial = async () => {
      const [roomRes, playersRes, rpRes] = await Promise.all([
        supabase.from('game_rooms').select('*').eq('id', roomId).single(),
        supabase.from('players').select('*').eq('room_id', roomId),
        supabase.from('room_puzzles').select('round_number, puzzle_id').eq('room_id', roomId)
      ]);

      if (roomRes.data) setRoom(roomRes.data as Room);
      if (playersRes.data) setPlayers(playersRes.data as Player[]);
      
      if (rpRes.data) {
        setUploadedCount(rpRes.data.length);
      }

      if (roomRes.data && roomRes.data.current_round > 0 && rpRes.data) {
        const currentRp = rpRes.data.find(rp => rp.round_number === roomRes.data.current_round);
        if (currentRp?.puzzle_id) {
          const { data: puzzle } = await supabase
            .from('puzzles')
            .select('image_url')
            .eq('id', currentRp.puzzle_id)
            .single();
          setCurrentPuzzleUrl(puzzle?.image_url || null);
        }
      }
    };

    fetchInitial();

    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: true } }
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const newRoom = payload.new as Room;
        setRoom(newRoom);
        
        if (newRoom.status === 'PLAYING' && newRoom.current_round > 0) {
          supabase.from('room_puzzles').select('puzzle_id')
            .eq('room_id', roomId)
            .eq('round_number', newRoom.current_round)
            .single()
            .then(async res => {
              if (res.data?.puzzle_id) {
                const { data: puzzle } = await supabase
                  .from('puzzles')
                  .select('image_url')
                  .eq('id', res.data.puzzle_id)
                  .single();
                setCurrentPuzzleUrl(puzzle?.image_url || null);
              }
            });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPlayer = payload.new as Player;
          setPlayers(prev => {
            if (prev.find(p => p.id === newPlayer.id)) return prev;
            return [...prev, newPlayer];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedPlayer = payload.new as Player;
          setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
        } else if (payload.eventType === 'DELETE') {
          setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_puzzles', filter: `room_id=eq.${roomId}` }, () => {
         setUploadedCount(prev => prev + 1);
      })
      .on('broadcast', { event: 'guess' }, (payload) => {
        setGuesses(prev => [...prev, payload.payload as GuessEntry]);
        // Clear typing when a guess is submitted
        if (payload.payload.playerId) {
          setTyping(prev => {
            const next = { ...prev };
            delete next[payload.payload.playerId];
            return next;
          });
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { playerId, playerName, text } = payload.payload;
        setTyping(prev => {
          if (!text) {
            const next = { ...prev };
            delete next[playerId];
            return next;
          }
          return {
            ...prev,
            [playerId]: { name: playerName, text }
          };
        });
      })
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { 
    room, 
    players: players.filter(p => !p.is_kicked).sort((a,b) => b.score - a.score), 
    currentPuzzleUrl,
    rawPlayers: players,
    uploadedCount,
    guesses,
    setGuesses,
    typing
  };
}
