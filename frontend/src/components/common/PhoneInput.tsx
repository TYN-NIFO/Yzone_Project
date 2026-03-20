import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'USA/Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, placeholder = '9876543210', label, required }: PhoneInputProps) {
  // Parse existing value into code + number
  const parseValue = (val: string) => {
    const match = COUNTRY_CODES.find(c => val.startsWith(c.code));
    if (match) return { dialCode: match.code, number: val.slice(match.code.length).trim() };
    return { dialCode: '+91', number: val.replace(/^\+\d+\s*/, '') };
  };

  const parsed = parseValue(value || '');
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCodeSelect = (code: string) => {
    setDialCode(code);
    setOpen(false);
    onChange(number ? `${code}${number}` : '');
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d]/g, '');
    setNumber(num);
    onChange(num ? `${dialCode}${num}` : '');
  };

  const selected = COUNTRY_CODES.find(c => c.code === dialCode) || COUNTRY_CODES[0];

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && ' *'}
        </label>
      )}
      <div className="flex" ref={ref}>
        {/* Dial code selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 text-sm h-full"
          >
            <span>{selected.flag}</span>
            <span className="font-medium text-gray-700">{selected.code}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
          {open && (
            <div className="absolute z-50 top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {COUNTRY_CODES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCodeSelect(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 text-left ${dialCode === c.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="ml-auto text-gray-400">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Number input */}
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>
    </div>
  );
}
