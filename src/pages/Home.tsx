import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Globe, Users } from 'lucide-react';
import { Header } from '../components/Header';

const PIP_LAYOUT: Record<number, number[]> = {
  3: [0, 4, 8],
  5: [0, 2, 4, 6, 8],
};

function Die({ pips, className }: { pips: number; className?: string }) {
  return (
    <div
      className={`grid size-11 grid-cols-3 grid-rows-3 gap-0.5 rounded-[10px] bg-white p-1.5 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] ${className ?? ''}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className='flex items-center justify-center'>
          {PIP_LAYOUT[pips].includes(i) ? (
            <span className='size-1.5 rounded-full bg-[#101828]' />
          ) : null}
        </span>
      ))}
    </div>
  );
}

function DiceHero() {
  return (
    <div className='relative size-[128px] rounded-[16px] bg-[linear-gradient(135deg,#e17100_0%,#973c00_100%)] shadow-[0px_12px_12px_rgba(0,0,0,0.5)] md:size-[150px]'>
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute left-0 top-1/2 h-px w-full bg-black' />
        <div className='absolute left-1/2 top-0 h-full w-px bg-black' />
      </div>
      <div className='absolute inset-0 flex items-center justify-center gap-2'>
        <Die pips={3} className='-rotate-12' />
        <Die pips={5} className='rotate-12' />
      </div>
      <div className='pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.2)]' />
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex h-[62px] w-full items-center justify-center gap-3 rounded-[16px] border border-white/10 bg-[rgba(30,41,59,0.9)] text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
    >
      {icon}
      <span className="font-['Inter'] text-[18px] font-medium">{label}</span>
    </button>
  );
}

export function Home() {
  const naviate = useNavigate();

  return (
    <div className='flex min-h-dvh w-full flex-col items-center bg-[linear-gradient(180deg,#3d6db5_0%,#2d5a9f_100%)] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]'>
      <div className='flex w-full max-w-[420px] flex-1 flex-col md:max-w-[520px]'>
        <Header />

        <main className='flex flex-1 flex-col items-center justify-center gap-6'>
          <div className='relative flex flex-col items-center'>
            <div className='pointer-events-none absolute -top-6 h-[120px] w-[185px] rounded-full bg-white/10 opacity-40 blur-[64px]' />
            <h1 className="font-['Cinzel'] text-[64px] font-black leading-none tracking-[0.25em] text-white drop-shadow-[0px_4px_12px_rgba(0,0,0,0.6)] md:text-[80px]">
              BB
            </h1>
            <p className="mt-2 font-['Cinzel'] text-[28px] font-bold uppercase tracking-[0.3em] text-[#e8d4b0] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.4)] md:text-[34px]">
              Backgammon
            </p>
          </div>

          <DiceHero />

          <div className='mt-2 flex w-full flex-col gap-4'>
            <MenuButton
              icon={<Play className='size-5' />}
              label='Play'
              onClick={() => naviate('/game')}
            />
            <MenuButton
              icon={<Globe className='size-5' />}
              label='Play Online'
            />
            <MenuButton
              icon={<Users className='size-5' />}
              label='Pass & Play'
            />
          </div>
        </main>

        <footer className='flex items-center justify-center py-4'>
          <p className="font-['Inter'] text-[12px] font-medium uppercase tracking-[0.3em] text-white opacity-40">
            Experience the Classic
          </p>
        </footer>
      </div>
    </div>
  );
}
