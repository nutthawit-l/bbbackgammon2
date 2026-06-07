import { Home as HomeIcon, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className='flex w-full items-center justify-between'>
      <button
        type='button'
        aria-label='Home'
        className='flex size-12 items-center justify-center rounded-[14px] bg-black/60 text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
      >
        <HomeIcon className='size-6' />
      </button>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          aria-label='Help'
          className='flex size-12 items-center justify-center rounded-[14px] bg-black/60 text-[20px] font-bold text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
        >
          ?
        </button>
        <button
          type='button'
          aria-label='Settings'
          className='flex size-12 items-center justify-center rounded-[14px] bg-black/60 text-white shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]'
        >
          <Settings className='size-6' />
        </button>
      </div>
    </header>
  );
}
