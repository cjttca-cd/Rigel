import { BookOpen, Lock, Mail, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LanguageSwitcherInline } from '../components/ui/LanguageSwitcherInline';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { signUpWithEmail } from '../services/firebase';

export function RegisterPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, withLang } = useI18n();
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    const validate = () => {
        const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

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

        if (password !== confirmPassword) {
            newErrors.confirmPassword = t('两次密码不一致');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await signUpWithEmail(email, password);
        setLoading(false);

        if (result.success) {
            showToast('success', t('注册成功'));
            navigate(withLang('/'));
        } else {
            showToast('error', result.error || t('注册失败'));
        }
    };

    return (
        <div className="min-h-screen flex relative">
            {/* Public page language switcher */}
            <div className="absolute top-4 right-4 z-50">
                <LanguageSwitcherInline />
            </div>
            {/* 左侧品牌区域 - 仅桌面端显示 */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
                {/* 装饰性背景元素 */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* 品牌内容 */}
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-9 h-9 text-white" />
                        </div>
                        <span className="text-3xl font-bold">财会助手 Rigel</span>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-6">
                        加入我们<br />
                        开启智能财务之旅
                    </h1>

                    <p className="text-lg text-white/80 max-w-md">
                        创建账户即可开始使用 AI 驱动的智能记账系统，体验高效、准确的财务管理。
                    </p>

                    {/* 注册优势 */}
                    <div className="mt-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white/90">免费注册，即刻使用</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white/90">数据安全加密存储</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white/90">专业客服支持</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧注册表单区域 */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-24 bg-gray-50">
                <div className="w-full max-w-md mx-auto">
                    {/* 移动端 Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">财会助手 Rigel</span>
                        </div>
                    </div>

                    {/* 欢迎语 */}
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            创建新账户
                        </h2>
                        <p className="mt-2 text-gray-500">
                            注册账户开始使用财会助手 Rigel
                        </p>
                    </div>

                    {/* 注册表单 */}
                    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                ref={emailInputRef}
                                label="邮箱地址"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                icon={<Mail className="w-5 h-5" />}
                                error={errors.email}
                                autoComplete="email"
                            />

                            <Input
                                label="密码"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock className="w-5 h-5" />}
                                error={errors.password}
                                helperText="密码至少6位"
                                autoComplete="new-password"
                            />

                            <Input
                                label="确认密码"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock className="w-5 h-5" />}
                                error={errors.confirmPassword}
                                autoComplete="new-password"
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                size="lg"
                                icon={<UserPlus className="w-5 h-5" />}
                            >
                                注册
                            </Button>
                        </form>

                        {/* 登录链接 */}
                        <p className="mt-6 text-center text-sm text-gray-500">
                            已有账户？{' '}
                            <Link
                                to="/login"
                                className="text-sky-600 hover:text-sky-700 font-medium"
                            >
                                立即登录
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
