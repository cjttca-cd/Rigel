import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

const LANGS = [
  { lang: 'zh', label: '中文', short: '中' },
  { lang: 'en', label: 'ENGLISH', short: 'EN' },
  { lang: 'ja', label: '日本語', short: '日' }
] as const;

type Lang = (typeof LANGS)[number]['lang'];

function stripLang(pathname: string) {
  // Remove leading /{lang}
  return pathname.replace(/^\/(zh|en|ja)(?=\/|$)/, '') || '/';
}

export function LanguageSwitcherInline({
  className = '',
  showCurrent = false,
  size = 'md',
  onNavigate
}: {
  className?: string;
  /** Whether to render the currently-selected language as a "selected" pill. */
  showCurrent?: boolean;
  /** md: 44px touch target (mobile friendly). sm: compact for tight spots. */
  size?: 'sm' | 'md';
  /** Callback after navigation (useful for closing menus). */
  onNavigate?: (lang: Lang) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useI18n();

  const restPath = useMemo(() => stripLang(location.pathname), [location.pathname]);

  const heightClass = size === 'md' ? 'min-h-[44px]' : 'min-h-[36px]';
  const paddingClass = size === 'md' ? 'px-3' : 'px-2.5';
  const textClass = size === 'md' ? 'text-sm' : 'text-xs';

  const items = showCurrent ? LANGS : LANGS.filter((item) => item.lang !== lang);

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`.trim()}
      role="group"
      aria-label={t('语言')}
    >
      {items.map((item) => {
        const active = item.lang === lang;
        return (
          <button
            key={item.lang}
            type="button"
            onClick={() => {
              if (active) return;
              navigate(`/${item.lang}${restPath}${location.search}`);
              onNavigate?.(item.lang);
            }}
            aria-pressed={active}
            title={item.label}
            className={[
              'rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2',
              heightClass,
              paddingClass,
              textClass,
              'font-semibold tracking-wide',
              active
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50',
              active ? 'cursor-default' : 'cursor-pointer'
            ].join(' ')}
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </button>
        );
      })}
    </div>
  );
}
