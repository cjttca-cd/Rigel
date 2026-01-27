import { BookOpen, Lock, Mail, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { isFirebaseConfigured, signInWithEmail, signInWithGoogle } from '../services/firebase';

import { LanguageSwitcherInline } from '../components/ui/LanguageSwitcherInline';

export function LoginPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, withLang } = useI18n();
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // localStorage 键名
    const REMEMBER_EMAIL_KEY = 'journal_remember_email';

    // 页面加载时：读取已保存的邮箱，并决定聚焦位置
    useEffect(() => {
        const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
            // 如果有保存的邮箱，聚焦到密码框
            // 使用 setTimeout 确保 DOM 已更新
            setTimeout(() => {
                const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                passwordInput?.focus();
            }, 100);
        } else {
            // 没有保存的邮箱，聚焦到邮箱输入框
            emailInputRef.current?.focus();
        }
    }, []);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = t('请输入邮箱');
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('邮箱格式不正确');
        }

        if (!password) {
            newErrors.password = t('请输入密码');
        } else if (password.length < 6) {
            newErrors.password = t('密码至少6位');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await signInWithEmail(email, password);
        setLoading(false);

        if (result.success) {
            // 根据"记住我"选项保存或清除邮箱
            if (rememberMe) {
                localStorage.setItem(REMEMBER_EMAIL_KEY, email);
            } else {
                localStorage.removeItem(REMEMBER_EMAIL_KEY);
            }
            showToast('success', t('登录成功'));
            navigate(withLang('/'));
        } else {
            showToast('error', result.error || t('登录失败'));
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        setLoading(false);

        if (result.success) {
            showToast('success', t('登录成功'));
            navigate(withLang('/'));
        } else {
            showToast('error', result.error || t('Google登录失败'));
        }
    };

    return (
        <div className="min-h-screen flex relative">
            {/* Public page language switcher */}
            <div className="absolute top-4 right-4 z-50">
                <LanguageSwitcherInline />
            </div>
            {/* 左侧品牌区域 - 仅桌面端显示 */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 relative overflow-hidden">
                {/* 装饰性背景元素 */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
                </div>

                {/* 品牌内容 */}
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-9 h-9 text-white" />
                        </div>
                        <span className="text-3xl font-bold">{t('财会助手 Rigel')}</span>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-6">
                        {t('智能记账')}<br />
                        {t('让财务更简单')}
                    </h1>

                    <p className="text-lg text-white/80 max-w-md mb-10">
                        {t('AI 驱动的智能记账系统，自动识别凭证、智能仕訳记录，助力企业财务效率提升。')}
                    </p>

                    {/* 特点列表 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-white/90">{t('AI 智能识别，自动生成仕訳')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-white/90">{t('一键生成 試算表 和 総勘定元帳')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span className="text-white/90">{t('安全可靠，数据加密存储')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧登录表单区域 */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-24 bg-gray-50">
                <div className="w-full max-w-md mx-auto">
                    {/* 移动端 Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{t('财会助手 Rigel')}</span>
                        </div>
                    </div>

                    {/* 欢迎语 */}
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('欢迎回来')}
                        </h2>
                        <p className="mt-2 text-gray-500">
                            {t('登录您的账户开始使用')}
                        </p>
                    </div>

                    {/* 登录表单 */}
                    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100">
                        {!isFirebaseConfigured && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="leading-snug">
                                        当前未配置 Firebase 环境变量，仅可预览登录页。
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.setItem('rigel_demo_mode', '1');
                                            navigate(withLang('/'));
                                        }}
                                        className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2"
                                    >
                                        Demo
                                    </button>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                ref={emailInputRef}
                                label={t('邮箱地址')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                icon={<Mail className="w-5 h-5" />}
                                error={errors.email}
                                autoComplete="email"
                            />

                            <Input
                                label={t('密码')}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock className="w-5 h-5" />}
                                error={errors.password}
                                autoComplete="current-password"
                            />

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-sm text-gray-600">{t('记住我')}</span>
                                </label>
                                <Link
                                    to={withLang('/forgot-password')}
                                    className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                                >
                                    {t('忘记密码？')}
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                size="lg"
                            >
                                {t('登录')}
                            </Button>
                        </form>

                        {/* 分割线 */}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">{t('或者')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Google 登录 */}
                        <div className="mt-6">
                            <Button
                                variant="secondary"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                fullWidth
                                size="lg"
                                icon={
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                }
                            >
                                {t('使用 Google 账户登录')}
                            </Button>
                        </div>

                        {/* 注册链接 */}
                        <p className="mt-6 text-center text-sm text-gray-500">
                            {t('还没有账户？')}{' '}
                            <Link
                                to={withLang('/register')}
                                className="text-sky-600 hover:text-sky-700 font-medium"
                            >
                                {t('立即注册')}
                            </Link>
                        </p>
                    </div>

                    {/* 底部版权 */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400 mb-1">
                            © 2026 Finance Copilot Rigel. All rights reserved.
                        </p>
                        <p className="text-xs text-gray-300">
                            Powered by Nebula Infinity AI Solution
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
