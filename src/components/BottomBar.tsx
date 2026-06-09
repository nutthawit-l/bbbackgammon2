import { Clock, Star } from 'lucide-react';

export function BottomBar() {
  return (
    <footer className='flex w-full items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]'>
      <div className='flex items-center gap-[7px]'>
        <Clock className='size-[17px] text-white' />
        <span className="font-['Inter'] text-[15px] font-semibold text-white">
          00:14
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <span className="font-['Inter'] text-[15px] font-semibold text-white">
          Online Game
        </span>
        <Star className='size-[17px] text-white' />
      </div>
    </footer>
  );
}
