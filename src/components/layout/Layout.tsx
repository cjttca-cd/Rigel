import type { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
    children: ReactNode;
    wide?: boolean;  // 宽布局，用于需要全宽表格的页面
}

export function Layout({ children, wide = false }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Navigation />
            <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-6 ${wide ? 'max-w-[1600px]' : 'max-w-7xl'
                }`}>
                {children}
            </main>
        </div>
    );
}
