import { useEffect } from 'react';
import { Compass } from 'lucide-react';
import BrandWordmark from '../app/components/BrandWordmark';
import './CoverScreen.css';

type CoverScreenProps = {
  tr: (key: string) => string;
};

export default function CoverScreen({ tr }: CoverScreenProps) {
  useEffect(() => {
    const root = document.documentElement;
    const previousThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content;
    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const setCoverViewportHeight = () => {
      root.style.setProperty('--cover-vh', `${window.innerHeight * 0.01}px`);
    };
    const isIphoneSafari = /iPhone/i.test(window.navigator.userAgent)
      && /Safari/i.test(window.navigator.userAgent)
      && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(window.navigator.userAgent);
    root.classList.add('cover-screen-active');
    root.classList.toggle('cover-screen-ios-safari', isIphoneSafari);
    document.body.classList.add('cover-screen-active');
    document.body.classList.toggle('cover-screen-ios-safari', isIphoneSafari);
    setCoverViewportHeight();
    themeColorMeta?.setAttribute('content', 'transparent');
    window.addEventListener('resize', setCoverViewportHeight);
    window.visualViewport?.addEventListener('resize', setCoverViewportHeight);
    window.visualViewport?.addEventListener('scroll', setCoverViewportHeight);

    return () => {
      root.classList.remove('cover-screen-active');
      root.classList.remove('cover-screen-ios-safari');
      root.style.removeProperty('--cover-vh');
      document.body.classList.remove('cover-screen-active');
      document.body.classList.remove('cover-screen-ios-safari');
      window.removeEventListener('resize', setCoverViewportHeight);
      window.visualViewport?.removeEventListener('resize', setCoverViewportHeight);
      window.visualViewport?.removeEventListener('scroll', setCoverViewportHeight);
      if (previousThemeColor && themeColorMeta) {
        themeColorMeta.setAttribute('content', previousThemeColor);
      }
    };
  }, []);

  return (
    <div className="cover-screen min-h-[100lvh] w-full overflow-hidden px-4 text-center select-none">
      <div className="cover-screen__background">
        <div className="cover-screen__shade absolute inset-0 z-10" />
      </div>

      <div className="cover-screen__content relative z-20 mx-auto flex min-h-[100lvh] w-full max-w-5xl flex-col items-center justify-center pb-[calc(22svh+env(safe-area-inset-bottom))] pt-[calc(10svh+env(safe-area-inset-top))] sm:pb-[20svh] sm:pt-[8svh]">
        <div className="flex translate-y-[-2svh] flex-col items-center sm:translate-y-[-3svh]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-md sm:mb-5 sm:px-4 animate-bounce-slow">
            <Compass className="w-4 h-4 text-[#FF7A50]" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white sm:text-xs">
              {tr('cover.badge')}
            </span>
          </div>

          <div className="mx-auto max-w-[92vw] pb-2">
            <BrandWordmark label={tr('brand.name')} variant="cover" />
          </div>

          <p className="mx-auto mt-3 max-w-[min(38rem,86vw)] text-balance font-sans text-base font-medium leading-relaxed text-emerald-50/90 drop-shadow-sm sm:mt-4 sm:text-xl">
            {tr('cover.subtitle')}
          </p>
        </div>
      </div>

      <div className="cover-screen__scroll-indicator absolute inset-x-0 bottom-[calc(6svh+env(safe-area-inset-bottom))] z-20 flex items-center justify-center text-white/90 sm:bottom-[7svh]">
        <div className="cover-scroll-mouse" aria-hidden="true">
          <div className="cover-scroll-mouse-shell">
            <div className="cover-scroll-wheel" />
          </div>
        </div>
        <div className="flex cover-swipe-hand" aria-hidden="true">
          <div className="cover-swipe-up">
            <span className="cover-swipe-up-arrow" />
            <span className="cover-swipe-up-track" />
            <span className="cover-swipe-up-dot" />
          </div>
        </div>
      </div>
      <div className="cover-screen__tail-spacer relative h-[18svh]" aria-hidden="true" />
    </div>
  );
}
