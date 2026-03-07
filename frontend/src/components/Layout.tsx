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
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
