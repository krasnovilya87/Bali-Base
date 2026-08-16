type BrandWordmarkProps = {
  label: string;
  variant?: 'cover' | 'header' | 'auth';
};

export default function BrandWordmark({ label, variant = 'header' }: BrandWordmarkProps) {
  const variantClass = {
    cover: 'text-[clamp(3rem,13vw,7.25rem)] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]',
    header: 'text-[18px] sm:text-[22px] text-[#FF7A50]',
    auth: 'text-[clamp(2.5rem,7vw,5.75rem)] text-white drop-shadow-[0_18px_38px_rgba(0,0,0,0.34)]'
  }[variant];

  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap font-logo font-black uppercase leading-none tracking-normal ${variantClass}`}
      aria-label={label}
    >
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
