import { BoardCanvas } from '../pixi/BoardCanvas';

export function Game() {
  return (
    <div className='flex h-dvh w-screen items-center justify-center p-3 bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)]'>
      <BoardCanvas />;
    </div>
  );
}
