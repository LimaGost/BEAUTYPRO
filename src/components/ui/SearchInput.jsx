// @ts-nocheck
import { Search, X } from 'lucide-react';

export function SearchInput({ value, onChange, onClear, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
        onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(201,168,97,0.4)'; }}
        onBlur={(e)  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)'; }}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
