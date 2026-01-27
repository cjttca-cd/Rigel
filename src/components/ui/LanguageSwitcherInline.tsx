import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

const LANGS = [
  { lang: 'ja', label: '日本語' },
  { lang: 'en', label: 'English' },
  { lang: 'zh', label: '中文' }
] as const;

function stripLang(pathname: string) {
  // Remove leading /{lang}
  return pathname.replace(/^\/(zh|en|ja)(?=\/|$)/, '') || '/';
}

export function LanguageSwitcherInline({
  className = ''
}: {
  className?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useI18n();

  const restPath = useMemo(() => stripLang(location.pathname), [location.pathname]);

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()} aria-label={t('语言')}>
      {LANGS.map((item) => {
        const active = item.lang === lang;
        return (
          <button
            key={item.lang}
            type="button"
            onClick={() => navigate(`/${item.lang}${restPath}${location.search}`)}
            className={
              `px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 ` +
              (active
                ? 'bg-gray-900 text-white'
                : 'bg-white/70 text-gray-700 hover:bg-white border border-gray-200')
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
