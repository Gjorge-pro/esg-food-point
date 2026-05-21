/**
 * Standardized button styles for consistent design
 * Usage: className={buttonStyles.primary}
 */

export const buttonStyles = {
  // Primary action buttons
  primary: 'rounded-xl bg-[var(--color-primary)] text-white px-4 py-2 font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md',
  
  // Primary large (for modals, etc)
  primaryLarge: 'rounded-xl bg-[var(--color-primary)] text-white px-6 py-3 font-bold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md',
  
  // Secondary buttons
  secondary: 'rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2 font-semibold transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-95',
  
  // Secondary large
  secondaryLarge: 'rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-6 py-3 font-bold transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-95',
  
  // Danger buttons
  danger: 'rounded-xl bg-red-600 text-white px-4 py-2 font-semibold transition-all duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Danger large
  dangerLarge: 'rounded-xl bg-red-600 text-white px-6 py-3 font-bold transition-all duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Ghost/Minimal
  ghost: 'rounded-xl text-[var(--text-primary)] px-4 py-2 font-semibold transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-95',
  
  // Small icon button
  iconSmall: 'inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[var(--bg-main)] transition-all duration-200 active:scale-95',
  
  // Tab button (for tab navigation)
  tab: 'px-4 py-2 font-medium rounded-lg transition-all duration-200 hover:bg-[var(--bg-main)]',
  
  // Active tab
  tabActive: 'px-4 py-2 font-semibold rounded-lg bg-[var(--color-primary)] text-white transition-all duration-200',
};

export const getButtonClass = (variant = 'primary', size = 'default', disabled = false) => {
  const baseClasses = [
    'rounded-xl font-semibold transition-all duration-200',
    'active:scale-95',
  ];

  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    default: 'px-4 py-2',
    large: 'px-6 py-3 font-bold',
  };

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md',
    secondary: 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-main)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'text-[var(--text-primary)] hover:bg-[var(--bg-main)]',
  };

  return [
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled && 'opacity-50 cursor-not-allowed',
  ]
    .filter(Boolean)
    .join(' ');
};
