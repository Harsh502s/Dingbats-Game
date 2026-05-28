import { describe, it, expect } from 'vitest';

describe('Round Advancement', () => {
  interface Room {
    current_round: number;
    total_rounds: number;
    status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  }

  function advanceRound(room: Room): Room {
    const nextRound = room.current_round + 1;

    if (nextRound > room.total_rounds) {
      return { ...room, status: 'FINISHED' };
    }

    return { ...room, current_round: nextRound };
  }

  it('should increment current_round', () => {
    const room: Room = { current_round: 1, total_rounds: 5, status: 'PLAYING' };
    const advanced = advanceRound(room);

    expect(advanced.current_round).toBe(2);
    expect(advanced.status).toBe('PLAYING');
  });

  it('should finish game when advancing past total_rounds', () => {
    const room: Room = { current_round: 5, total_rounds: 5, status: 'PLAYING' };
    const advanced = advanceRound(room);

    expect(advanced.status).toBe('FINISHED');
    expect(advanced.current_round).toBe(5); // unchanged
  });

  it('should handle single-round games', () => {
    const room: Room = { current_round: 1, total_rounds: 1, status: 'PLAYING' };
    const advanced = advanceRound(room);

    expect(advanced.status).toBe('FINISHED');
  });

  it('should handle multi-round games', () => {
    let room: Room = { current_round: 1, total_rounds: 10, status: 'PLAYING' };

    for (let i = 1; i < 10; i++) {
      room = advanceRound(room);
      expect(room.current_round).toBe(i + 1);
      expect(room.status).toBe('PLAYING');
    }

    room = advanceRound(room);
    expect(room.status).toBe('FINISHED');
  });

  it('should not advance beyond finished state', () => {
    const room: Room = { current_round: 5, total_rounds: 5, status: 'FINISHED' };
    const advanced = advanceRound(room);

    expect(advanced.status).toBe('FINISHED');
  });

  it('should preserve other room properties', () => {
    const room: Room = { current_round: 2, total_rounds: 5, status: 'PLAYING' };
    const advanced = advanceRound(room);

    expect(advanced.total_rounds).toBe(5);
  });
});
