import type { ReactNode } from 'react'
import Navigation from './Navigation'

interface LayoutProps {
  children: ReactNode
  showNavigation?: boolean
}

export default function Layout({ children, showNavigation = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background mobile-safe-area">
      {/* Navigation Sidebar */}
      {showNavigation && <Navigation />}
      
      {/* Main Content */}
      <div className={showNavigation ? "lg:pl-64" : ""}>
        {/* Mobile spacing for header */}
        {showNavigation && <div className="lg:hidden h-16" />}
        
        {/* Page Content */}
        <main className="flex-1 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
