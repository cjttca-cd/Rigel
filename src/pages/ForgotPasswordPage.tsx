import { ArrowLeft, BookOpen, CheckCircle, Mail, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LanguageSwitcherInline } from '../components/ui/LanguageSwitcherInline';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { sendPasswordReset } from '../services/firebase';

export function ForgotPasswordPage() {
    const { showToast } = useToast();
    const { t, withLang } = useI18n();
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError(t('请输入邮箱'));
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError(t('邮箱格式不正确'));
            return;
        }

        setError('');
        setLoading(true);
        const result = await sendPasswordReset(email);
        setLoading(false);

        if (result.success) {
            setSent(true);
            showToast('success', t('重置邮件已发送'));
        } else {
            showToast('error', result.error || t('发送失败'));
        }
    };

    // 发送成功页面
    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
                {/* Public page language switcher */}
                <div className="absolute top-4 right-4 z-50">
                    <LanguageSwitcherInline />
                </div>
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-6 shadow-lg rounded-2xl sm:px-10 border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            {t('邮件已发送')}
                        </h2>
                        <p className="text-gray-500 mb-8">
                            {t('我们已向 {email} 发送了密码重置链接，请查收邮件。', { email })}
                        </p>
                        <Link
                            to={withLang('/login')}
                            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 rounded-xl transition-all shadow-lg shadow-sky-500/25"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('返回登录')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Public page language switcher */}
            <div className="absolute top-4 right-4 z-50">
                <LanguageSwitcherInline />
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo */}
                <div className="flex justify-center">
                    <Link to={withLang('/login')} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{t('财会助手 Rigel')}</span>
                    </Link>
                </div>

                <h1 className="mt-8 text-center text-2xl font-bold text-gray-900">
                    {t('重置密码')}
                </h1>
                <p className="mt-2 text-center text-gray-500">
                    {t('输入您的邮箱，我们将发送重置链接')}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            ref={emailInputRef}
                            label={t('邮箱地址')}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            icon={<Mail className="w-5 h-5" />}
                            error={error}
                            autoComplete="email"
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            size="lg"
                            icon={<Send className="w-5 h-5" />}
                        >
                            {t('发送重置链接')}
                        </Button>
                    </form>

                    {/* 返回登录 */}
                    <div className="mt-6 text-center">
                        <Link
                            to={withLang('/login')}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('返回登录')}
                        </Link>
                    </div>
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
    );
}
