type BrandWordmarkProps = {
  label: string;
  variant?: 'cover' | 'header' | 'auth';
};

export default function BrandWordmark({ label, variant = 'header' }: BrandWordmarkProps) {
  const displayLabel = label.toLocaleUpperCase('en-US');
  const baseStartIndex = displayLabel.toLocaleLowerCase('en-US').indexOf('base');
  const logoAColor = variant === 'header' ? '#1E293B' : '#d47558';
  const variantClass = {
    cover: 'text-[clamp(3.35rem,13vw,6.5rem)] text-white tracking-[0.08em] drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]',
    header: 'text-[21px] sm:text-[26px] text-[#FF7A50] tracking-[0.045em]',
    auth: 'text-[clamp(2.9rem,7.6vw,6.35rem)] text-white tracking-[0.08em] drop-shadow-[0_18px_38px_rgba(0,0,0,0.34)]'
  }[variant];

  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap font-logo font-extrabold uppercase leading-none ${variantClass}`}
      aria-label={label}
    >
      {baseStartIndex >= 0 ? (
        <span aria-hidden="true">
          {displayLabel.slice(0, baseStartIndex + 1)}
          <span
            className="inline-block h-[0.72em] w-[0.74em] -translate-y-[0.0em]"
            style={{
              backgroundColor: logoAColor,
              WebkitMaskImage: 'url(/logo-a.svg)',
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              maskImage: 'url(/logo-a.svg)',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
              maskSize: 'contain'
            }}
          />
          {displayLabel.slice(baseStartIndex + 2)}
        </span>
      ) : (
        <span aria-hidden="true">{displayLabel}</span>
      )}
    </span>
  );
}
