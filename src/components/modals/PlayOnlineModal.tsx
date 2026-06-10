interface PlayOnlineModalProps {
  onClose: () => void;
  onPlayAnyone: () => void;
  onInvite: () => void;
}

export function PlayOnlineModal({
  onClose,
  onPlayAnyone,
  onInvite,
}: PlayOnlineModalProps) {
  return (
    <div
      className='absolute inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className='flex w-[345px] flex-col items-center gap-3 rounded-[24px] border-2 border-[#364153]/50 bg-[#101828]/95 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex w-full items-center justify-center px-[10px] py-[10px]'>
          <h2 className="text-center font-['Inter'] text-[36px] font-bold leading-[40px] text-white">
            Play Online
          </h2>
        </div>

        {/* Body */}
        <div className='flex w-[277px] flex-col gap-3'>
          {/* Subtitle */}
          <p className="text-center font-['Inter'] text-[16px] leading-[24px] text-[#d1d5dc]">
            Play a random online opponent
          </p>

          {/* Play Anyone button */}
          <button
            type='button'
            onClick={onPlayAnyone}
            className="flex h-[58px] w-full items-center justify-center rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]"
          >
            Play Anyone
          </button>

          {/* Separator text */}
          <p className="text-center font-['Inter'] text-[16px] leading-[24px] text-[#99a1af]">
            or invite a friend to play online
          </p>

          {/* Invite a Friend button */}
          <button
            type='button'
            onClick={onInvite}
            className="flex h-[58px] w-full items-center justify-center rounded-[16px] border border-[#364153]/50 bg-[#1e2939]/90 font-['Inter'] text-[16px] font-medium text-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]"
          >
            Invite a Friend
          </button>
        </div>
      </div>
    </div>
  );
}
