import { BarChart3, BookOpen, FileText, Home, LogOut, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supportedLangs, useI18n } from '../../contexts/I18nContext';
import { signOut } from '../../services/firebase';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
    { path: '/transactions', label: '账目管理', icon: <FileText className="w-5 h-5" /> },
    { path: '/reports', label: '报表中心', icon: <BarChart3 className="w-5 h-5" /> },
];

export function Navigation() {
    const { user } = useAuth();
    const location = useLocation();
    const { lang, t, withLang } = useI18n();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const stripLangPath = location.pathname.replace(/^\/(zh|en|ja)(?=\/|$)/, '') || '/';

    const isActive = (path: string) => {
        if (path === '/') {
            return stripLangPath === '/';
        }
        return stripLangPath.startsWith(path);
    };

    const basePath = stripLangPath === '/' ? '' : stripLangPath;
    const languageLinks = supportedLangs.map((targetLang) => ({
        lang: targetLang,
        to: `/${targetLang}${basePath}${location.search}`
    }));

    return (
        <>
            {/* 桌面端顶部导航栏 */}
            <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo + 导航链接 */}
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <Link to={withLang('/')} className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-semibold text-gray-900">
                                    {t('财会助手 Rigel')}
                                </span>
                            </Link>

                            {/* 导航链接 */}
                            <nav className="flex items-center gap-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={withLang(item.path)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 ${isActive(item.path)
                                            ? 'bg-sky-50 text-sky-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {item.icon}
                                        {t(item.label)}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* 用户菜单 */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="text-xs uppercase tracking-wide text-gray-400">{t('语言')}</span>
                                <div className="flex items-center gap-2">
                                    {languageLinks.map((item) => (
                                        <Link
                                            key={item.lang}
                                            to={item.to}
                                            className={`text-xs font-medium transition-colors ${item.lang === lang
                                                ? 'text-sky-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {item.lang === 'zh' ? t('中文') : item.lang === 'en' ? t('English') : t('日本語')}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        {user?.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4 text-gray-500" />
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium max-w-[150px] truncate">
                                        {user?.email?.split('@')[0] || t('用户')}
                                    </span>
                                </button>

                                {/* 用户下拉菜单 */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user?.displayName || t('用户')}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t('退出登录')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 移动端顶部栏 */}
            <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="flex items-center justify-between h-14 px-4">
                    {/* Logo */}
                    <Link to={withLang('/')} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-base font-semibold text-gray-900">
                            {t('财会助手 Rigel')}
                        </span>
                    </Link>

                    {/* 菜单按钮 */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* 移动端菜单下拉 */}
                {mobileMenuOpen && (
                    <div className="border-t border-gray-100 bg-white animate-fade-in">
                        <div className="px-4 py-4 space-y-2">
                            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    {user?.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.displayName || t('用户')}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 text-xs uppercase tracking-wide text-gray-400">
                                {t('语言')}
                                {languageLinks.map((item) => (
                                    <Link
                                        key={item.lang}
                                        to={item.to}
                                        className={`text-xs font-medium ${item.lang === lang ? 'text-sky-600' : 'text-gray-500'}`}
                                    >
                                        {item.lang === 'zh' ? t('中文') : item.lang === 'en' ? t('English') : t('日本語')}
                                    </Link>
                                ))}
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                {t('退出登录')}
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* 移动端底部导航栏 */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={withLang(item.path)}
                            className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 ${isActive(item.path)
                                ? 'text-sky-600'
                                : 'text-gray-500'
                                }`}
                        >
                            {item.icon}
                            <span className="text-xs font-medium">{t(item.label)}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}
