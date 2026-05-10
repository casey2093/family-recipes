"use client";

import { useState, useEffect, useRef } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}

export default function FilterDropdown({ value, onChange, options, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white transition-colors cursor-pointer whitespace-nowrap
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300"}
          ${open ? "border-recipe-navy" : ""}`}
      >
        <span className={selected ? "text-recipe-navy font-semibold" : "text-gray-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-20 min-w-full">
          {/* "All" / clear option */}
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors
              ${!value ? "text-recipe-pink font-semibold" : "text-gray-500 hover:text-recipe-pink"}`}
          >
            {placeholder}
          </button>
          <div className="mx-3 my-1 border-t border-gray-100" />
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors
                ${value === option.value
                  ? "text-recipe-pink font-semibold"
                  : "text-gray-700 hover:text-recipe-pink"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
