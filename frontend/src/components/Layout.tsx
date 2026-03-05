import type { ReactNode } from 'react'
import Navigation from './Navigation'

interface LayoutProps {
  children: ReactNode
  showNavigation?: boolean
}

export default function Layout({ children, showNavigation = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNavigation && <Navigation />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
