import { create } from 'zustand';
import type { PlayerColor } from '../core/constants';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'waiting'
  | 'playing';

interface GameState {
  status: ConnectionStatus;
  roomId: string | null;
  playerColor: PlayerColor | null;
  countdown: number;

  setStatus: (status: ConnectionStatus) => void;
  setRoom: (roomId: string, color: PlayerColor) => void;
  decrementCountdown: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  status: 'disconnected' as const,
  roomId: null,
  playerColor: null,
  countdown: 600,
};

export const useGameStore = create<GameState>((set) => ({
  ...INITIAL_STATE,

  setStatus: (status) => set({ status }),
  setRoom: (roomId, playerColor) => set({ roomId, playerColor }),
  decrementCountdown: () =>
    set((state) => ({ countdown: Math.max(0, state.countdown - 1) })),
  reset: () => set(INITIAL_STATE),
}));
