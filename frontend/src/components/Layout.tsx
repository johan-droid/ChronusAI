import { type ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="galaxy-bg" />
            <div className="stars">
                <div className="star" />
                <div className="star" />
                <div className="star" />
            </div>
            <div className="relative z-10 w-full">
                <div className="max-w-full sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-safe-area-inset-top">
                    {children}
                </div>
            </div>
        </div>
    );
}
