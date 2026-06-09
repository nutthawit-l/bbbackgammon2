import { BoardCanvas } from '../pixi/BoardCanvas';
import { Header } from '../components/Header';
import { PlayerBar } from '../components/PlayerBar';
import { BottomBar } from '../components/BottomBar';

export function Game() {
  return (
    <div className='flex h-dvh w-full flex-col bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)]'>
      <Header />
      <main className='flex min-h-0 flex-1 w-full flex-col justify-center'>
        <PlayerBar variant='them' />
        <BoardCanvas />
        <PlayerBar variant='you' />
      </main>
      <BottomBar />
    </div>
  );
}
