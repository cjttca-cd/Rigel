import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

const LANGS = [
  { lang: 'ja', label: '日' },
  { lang: 'en', label: 'EN' },
  { lang: 'zh', label: '中' }
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
      {LANGS.filter((item) => item.lang !== lang).map((item) => (
        <button
          key={item.lang}
          type="button"
          onClick={() => navigate(`/${item.lang}${restPath}${location.search}`)}
          className="px-2 py-1.5 min-h-[32px] min-w-[32px] rounded-md text-xs font-semibold tracking-wide bg-white/80 text-gray-700 hover:bg-white border border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2"
          title={item.lang === 'ja' ? '日本語' : item.lang === 'en' ? 'English' : '中文'}
          aria-label={item.lang === 'ja' ? '日本語' : item.lang === 'en' ? 'English' : '中文'}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
