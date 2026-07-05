"use client";

import { useEffect, useRef } from "react";
import { cn } from "./cn";

/**
 * Auto-resizing Textarea Component
 * 
 * Automatically adjusts height based on content
 * Prevents horizontal overflow with proper text wrapping
 */
export function AutoResizeTextarea({ 
  className, 
  value, 
  onChange,
  minRows = 3,
  maxRows = 15,
  onFocus,
  onBlur,
  ...rest 
}) {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate line height
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseInt(style.lineHeight);
    
    // Calculate min and max heights
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    
    // Set new height within constraints
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Show scrollbar only when max height is reached
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e) => {
    adjustHeight();
    onChange?.(e);
  };

  const handleFocus = (e) => {
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    onBlur?.(e);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "w-full min-w-0 max-w-full rounded-2xl border border-glass-border bg-navy-950/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-40",
        "break-words whitespace-pre-wrap resize-none overflow-hidden",
        className
      )}
      rows={minRows}
      {...rest}
    />
  );
}
