export function PlayerBar({ variant }: { variant: 'them' | 'you' }) {
  const isThem = variant === 'them';

  return (
    <div
      className={`flex w-full justify-center gap-6 ${
        isThem ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-[8px] bg-[#1c1c1c] px-2 py-1 drop-shadow-[0px_2px_4px_rgba(0,0,0,0.55)] ${
          isThem ? 'border border-[#e8d4b0]' : ''
        }`}
      >
        <span
          className={`size-3 rounded-[6px] border ${
            isThem
              ? 'border-[#a81800] bg-[#d42200]'
              : 'border-[#9a9490] bg-[#e0dcd5]'
          }`}
        />
        <div className='flex flex-col gap-0.5'>
          <span className="font-['Inter'] text-[12px] font-bold leading-[12px] text-white">
            {isThem ? 'Them' : 'You'}
          </span>
          <span className="font-['Inter'] text-[10px] font-normal leading-[10px] text-[#aaa]">
            PIP: 158 5:0 / 1
          </span>
        </div>
      </div>
      <div className='flex items-center rounded-[8px] bg-[#1c1c1c] px-2 py-1 drop-shadow-[0px_2px_4px_rgba(0,0,0,0.55)]'>
        <span className="font-['Inter'] text-[10px] font-normal leading-[10px] text-[#aaa]">
          Timer:&nbsp;
        </span>
        <span className="font-['Inter'] text-[12px] font-bold leading-[12px] text-white">
          00:00
        </span>
      </div>
    </div>
  );
}
