import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Opens a WebSocket to /ws/room/:roomId.
 * Updates the Zustand store with connection events.
 * Calls `onGameStart` when bot players are connected.
 *
 * Pass `roomId = null` to skip connecting.
 */
export function useRoomSocket(
  roomId: string | null,
  onGameStart?: (roomId: string) => void,
) {
  const setStatus = useGameStore((s) => s.setStatus);
  const setRoom = useGameStore((s) => s.setRoom);
  const onGameStartRef = useRef(onGameStart);
  onGameStartRef.current = onGameStart;

  useEffect(() => {
    if (!roomId) return;

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/room/${roomId}`,
    );

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data as string);
      if (data.type === 'connected') {
        setRoom(roomId, data.color);
        setStatus('waiting');
      } else if (data.type === 'game_start') {
        setStatus('playing');
        onGameStartRef.current?.(roomId);
      }
    });

    ws.addEventListener('close', () => {
      setStatus('disconnected');
    });

    return () => {
      ws.close();
    };
  }, [roomId, setStatus, setRoom]);
}
