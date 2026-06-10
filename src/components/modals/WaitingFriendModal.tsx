import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

interface WaitingFriendModalProps {
  onCancel: () => void;
}

export function WaitingFriendModal({ onCancel }: WaitingFriendModalProps) {
  const countdown = useGameStore((s) => s.countdown);
  const decrement = useGameStore((s) => s.decrementCountdown);

  useEffect(() => {
    const timer = setInterval(() => decrement(), 1000);
    return () => clearInterval(timer);
  }, [decrement]);

  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='flex w-[345px] flex-col items-center gap-3 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]'>
        {/* Header */}
        <div className='flex w-full items-center justify-center px-[10px] py-[10px]'>
          <h2 className="text-center font-['Inter'] text-[36px] font-bold leading-[40px] text-white">
            Waiting Friend
          </h2>
        </div>

        {/* Body */}
        <div className='flex w-[277px] flex-col gap-3'>
          {/* Subtitle */}
          <p className="text-center font-['Inter'] text-[16px] leading-[24px] text-[#d1d5dc]">
            Please wait your friend joins.
          </p>

          {/* Countdown */}
          <p className="text-center font-['Inter'] text-[16px] leading-[24px] text-[#d1d5dc]">
            {minutes}:{seconds} Remaining
          </p>

          {/* Cancel button */}
          <button
            type='button'
            onClick={onCancel}
            className="flex h-[58px] w-full items-center justify-center rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
