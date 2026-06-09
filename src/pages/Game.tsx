import { useCallback, useRef, useState } from 'react';
import { BoardCanvas } from '../pixi/BoardCanvas';
import { Header } from '../components/Header';
import { PlayerBar } from '../components/PlayerBar';
import { BottomBar } from '../components/BottomBar';

export function Game() {
  const mainRef = useRef<HTMLElement>(null);
  const [boardWidth, setBoardWidth] = useState<number | undefined>(undefined);

  const handleBoardWidth = useCallback((width: number) => {
    setBoardWidth(width);
  }, []);

  return (
    <div className='flex h-dvh w-full flex-col bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)]'>
      <Header />
      <main ref={mainRef} className='flex min-h-0 flex-1 w-full flex-col items-center justify-center'>
        <PlayerBar variant='them' maxWidth={boardWidth} />
        <BoardCanvas containerRef={mainRef} onBoardWidth={handleBoardWidth} />
        <PlayerBar variant='you' maxWidth={boardWidth} />
      </main>
      <BottomBar />
    </div>
  );
}
