export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <a href="/" aria-label="DestinyVox home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 40 40" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" fill="none">
        <circle cx="20" cy="20" r="16.5" stroke="#C8A96B" strokeOpacity=".5" />
        <ellipse cx="20" cy="20" rx="8" ry="16.5" transform="rotate(38 20 20)" stroke="#C8A96B" strokeOpacity=".7" />
        <path d="M20 10.5 22.7 17.3 29.5 20l-6.8 2.7-2.7 6.8-2.7-6.8-6.8-2.7 6.8-2.7 2.7-6.8Z" fill="#E6C98D" />
        <circle cx="30.8" cy="10.1" r="1.4" fill="#F3E5C4" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-editorial text-[19px] tracking-[-.045em] text-[#f4efe6] sm:text-[21px]">Destiny<span className="ml-1 font-mono text-[10px] font-medium tracking-[.2em] text-[#D7B875] sm:text-[11px]">VOX</span></span>
        <span className="mt-1.5 font-mono text-[7px] tracking-[.31em] text-[#958c7b] sm:text-[8px]">NUMEROLOGY</span>
      </span>
    </a>
  );
}
