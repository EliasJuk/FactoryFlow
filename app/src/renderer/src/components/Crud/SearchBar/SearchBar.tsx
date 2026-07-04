import { Search } from "lucide-react"

type SearchBarProps = {
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function SearchBar({
  value,
  placeholder = "Pesquisar...",
  onChange
}: SearchBarProps) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
      <Search size={16} className="text-[var(--text-light)]" />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
    </div>
  )
}