import { useLocaleStore } from '@/i18n';
import type { Locale } from '@/types';
import './Header.css';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  transparent?: boolean;
  title?: string;
}

export function Header({ showBack, onBack, transparent, title }: HeaderProps) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const toggleLocale = () => {
    const next: Locale = locale === 'ru' ? 'en' : 'ru';
    setLocale(next);
  };

  return (
    <header
      className={`app-header ${transparent ? 'app-header--transparent' : ''} ${title ? 'app-header--titled' : ''}`}
    >
      <div className="app-header__left">
        {showBack && onBack ? (
          <button type="button" className="app-header__back" onClick={onBack} aria-label="Back">
            ←
          </button>
        ) : (
          <span className="app-header__logo" aria-hidden>
            ॐ
          </span>
        )}
      </div>
      {title && <h1 className="app-header__title">{title}</h1>}
      <button
        type="button"
        className="app-header__lang"
        onClick={toggleLocale}
        aria-label={`Language: ${locale}`}
      >
        {locale.toUpperCase()}
      </button>
    </header>
  );
}
