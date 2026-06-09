import { BoardCanvas } from '../pixi/BoardCanvas';
import { Header } from '../components/Header';
import { PlayerBar } from '../components/PlayerBar';
import { BottomBar } from '../components/BottomBar';

export function Game() {
  return (
    <div className='flex h-dvh w-full flex-col bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]'>
      <Header />
      <main className='flex min-h-0 flex-1 w-full items-center justify-center p-2'>
        <div className='flex h-full flex-col w-full items-center justify-center gap-2'>
          <div className='aspect-[389/328] max-h-full max-w-full min-h-0 w-full overflow-hidden flex flex-col justify-between gap-0'>
            <PlayerBar variant='them' />
            <BoardCanvas />
            <PlayerBar variant='you' />
          </div>
        </div>
      </main>
      <BottomBar />
    </div>
  );
}
