export function PlayerBar({
  variant,
  isActive = false,
}: {
  variant: 'them' | 'you';
  isActive?: boolean;
}) {
  const isThem = variant === 'them';

  return (
    <div
      className={`flex w-full h-8 items-center justify-between bg-[#1c1c1c] px-2 ${
        isActive ? 'border border-[#e8d4b0]' : ''
      }`}
    >
      <div className='flex items-center gap-2'>
        <span
          className={`size-3 rounded-[6px] border ${
            isThem
              ? 'border-[#a81800] bg-[#d42200]'
              : 'border-[#9a9490] bg-[#e0dcd5]'
          }`}
        />
        <div className='flex flex-col justify-center'>
          <span className="font-['Inter'] text-[12px] font-bold leading-[1.2] text-white">
            {isThem ? 'Them' : 'You'}
          </span>
          <span className="font-['Inter'] text-[10px] font-normal leading-[1.2] text-[#aaa]">
            PIP: 158 5:0 / 1
          </span>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <div className='flex items-center'>
          <span className="font-['Inter'] text-[10px] font-normal text-[#aaa]">
            Timer:&nbsp;
          </span>
          <span className="font-['Inter'] text-[12px] font-bold text-[#e8d4b0]">
            00:00
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <button
            className={`flex h-[24px] min-w-[60px] items-center justify-center px-2 rounded-[8px] font-['Inter'] text-[10px] font-bold transition-colors ${
              isActive
                ? 'bg-[#1c1c1c] border border-[#e8d4b0] text-[#e8d4b0] hover:bg-[#e8d4b0]/10'
                : 'text-[#333] cursor-not-allowed'
            }`}
            disabled={!isActive}
          >
            Undo
          </button>
          <button
            className={`flex h-[24px] min-w-[60px] items-center justify-center px-2 rounded-[8px] font-['Inter'] text-[10px] font-bold transition-colors ${
              isActive
                ? 'bg-[#1c1c1c] border border-[#e8d4b0] text-[#e8d4b0] hover:bg-[#e8d4b0]/10'
                : 'text-[#333] cursor-not-allowed'
            }`}
            disabled={!isActive}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
