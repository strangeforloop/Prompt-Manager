'use client';

import { useState, useRef } from 'react';

export function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = content;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        w-full py-4 px-8 font-mono text-sm uppercase tracking-widest
        border transition-all duration-300 cursor-pointer
        ${
          copied
            ? 'bg-[#4a7c59] border-[#4a7c59] text-[#f5efe0]'
            : 'bg-transparent border-[#C9973A] text-[#C9973A] hover:bg-[#C9973A] hover:text-[#0f0e0c]'
        }
      `}
    >
      {copied ? '✓ Copied to clipboard' : 'Copy Prompt'}
    </button>
  );
}
