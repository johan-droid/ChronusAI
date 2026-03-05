import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import Input from './Input'
import Button from './Button'
import Dropdown from './Dropdown'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  onFilter?: (filter: string) => void
  filters?: Array<{ id: string; label: string }>
  className?: string
}

export default function SearchBar({ 
  placeholder = 'Search...', 
  onSearch, 
  onFilter, 
  filters = [],
  className = '' 
}: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  const handleFilterSelect = (filterId: string) => {
    onFilter?.(filterId)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            icon={<Search className="h-4 w-4" />}
            className="pr-20"
          />
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Filter Dropdown */}
      {filters.length > 0 && (
        <Dropdown
          trigger={
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          }
          items={filters.map(filter => ({
            id: filter.id,
            label: filter.label,
            onClick: () => handleFilterSelect(filter.id)
          }))}
          align="right"
        />
      )}
    </div>
  )
}
