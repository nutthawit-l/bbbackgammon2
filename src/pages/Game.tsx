import { BoardCanvas } from '../pixi/BoardCanvas';
import { Header } from '../components/Header';
import { PlayerBar } from '../components/PlayerBar';
import { BottomBar } from '../components/BottomBar';

export function Game() {
  return (
    <div className='flex min-h-dvh w-full flex-col items-center bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)] px-6 pt-4 pb-4'>
      <div className='flex w-full max-w-[420px] flex-1 flex-col'>
        <Header />
        <main className='flex flex-1 flex-col justify-center gap-2'>
          <PlayerBar variant='them' />
          <div className='flex min-h-0 flex-1 items-center justify-center'>
            <BoardCanvas />
          </div>
          <PlayerBar variant='you' />
        </main>
        <BottomBar />
      </div>
    </div>
  );
}
