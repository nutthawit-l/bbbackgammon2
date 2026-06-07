import { Clock, Star } from 'lucide-react';

export function BottomBar() {
  return (
    <footer className='flex w-full items-center justify-between p-4'>
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
