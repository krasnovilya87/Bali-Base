/**
 * Bali Base Web Application Design System Theme
 * 
 * Edit this single file to easily customize the entire appearance of the application:
 * - Update font classifications (Main Font, Headings Font, Mono Font)
 * - Modify central color palettes and their corresponding Tailwind CSS utility classes
 */

export const THEME = {
  // ===================================
  // 1. TYPOGRAPHY CONFIGURATION (FONTS)
  // ===================================
  fonts: {
    // Основной шрифт для всего сайта (для контента, описаний, кнопок, форм)
    main: 'font-sans',      // mapped to --font-sans (default Manrope)
    
    // Шрифт для заголовков (панелей, карточек, фильтров, диалогов, главного названия)
    heading: 'font-heading', // mapped to --font-display/--font-heading (default Manrope)
    
    // Шрифт для цен, расстояний, счетчиков, таймеров и рейтингов (теперь Manrope)
    mono: 'font-mono'       // mapped to --font-mono (redefined to Manrope)
  },

  // ===================================
  // 2. CENTRAL COLOR DESIGN PALETTES
  // ===================================
  colors: {
    // Primary Brand Orange Color (for badges, active tabs, main accents)
    brandOrange: '#FF7A50',
    brandOrangeHover: '#E05A30',

    // Secure Direct Deal Green Color (for direct contacts, prices, verified deals)
    directGreen: '#2F7D69',

    // Deep Dark Text Color (for clean dark typography)
    textDark: '#1E293B',

    // Light Airy Background Color (for sections, containers, side bars)
    bgLight: '#F4F7F6',
    
    // Standard Border Color
    borderLight: '#E5E7EB'
  },

  // ===================================
  // 3. PRE-COMPILED REUSABLE STYLING CLASSES
  // ===================================
  styles: {
    // Buttons (Accents and Core)
    buttonPrimary: 'bg-brand-orange hover:bg-brand-orange-hover text-white transition-all active:scale-95 duration-200 cursor-pointer shadow-sm',
    buttonSecondary: 'bg-white border border-[#E5E7EB] text-text-dark hover:bg-bg-light transition-all duration-200 cursor-pointer',
    buttonDirect: 'bg-direct-green hover:bg-opacity-95 text-white transition-all duration-200 cursor-pointer',
    buttonWhite: 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold transition duration-200 cursor-pointer',
    
    // Cards & Panels
    cardContainer: 'bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-lg',
    modalContainer: 'bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col',
    
    // Badges
    badgeDirect: 'text-direct-green bg-direct-green/10 border border-direct-green/20 font-bold font-mono tracking-tight',
    badgeSecondary: 'text-text-dark bg-[#94A3B8]/10 border border-[#94A3B8]/20 font-sans',
    
    // Text Accents
    textPrice: 'text-direct-green font-mono font-extrabold',
    logoText: 'text-brand-orange uppercase tracking-widest font-black',
  }
};
