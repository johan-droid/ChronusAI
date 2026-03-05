import { useState } from 'react'

interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
}

export default function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab?.disabled) {
      setActiveTab(tabId)
    }
  }

  const activeTabData = tabs.find(t => t.id === activeTab)

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex space-x-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : tab.disabled
                ? 'text-muted-foreground cursor-not-allowed border-transparent'
                : 'text-muted-foreground hover:text-foreground hover:border-muted border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTabData?.content}
      </div>
    </div>
  )
}
