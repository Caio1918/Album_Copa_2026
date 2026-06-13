import { Search } from 'lucide-react';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder = 'Pesquisar...' }: SearchInputProps) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
