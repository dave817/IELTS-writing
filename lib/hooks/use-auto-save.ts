"use client";

import { useEffect, useCallback, useRef } from "react";

interface AutoSaveState {
  text: string;
  timer: number;
  questionId?: string;
  questionText?: string;
  startedAt?: number;
}

interface UseAutoSaveOptions {
  key: string;
  debounceMs?: number;
}

/**
 * Hook for auto-saving drill state to localStorage
 * Prevents losing work if browser crashes or tab is closed
 */
export function useAutoSave({ key, debounceMs = 1000 }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `ielts-drill-${key}`;

  // Save state to localStorage with debounce
  const save = useCallback(
    (state: AutoSaveState) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        try {
          const dataToSave = {
            ...state,
            savedAt: Date.now(),
          };
          localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        } catch (error) {
          console.error("Failed to save to localStorage:", error);
        }
      }, debounceMs);
    },
    [storageKey, debounceMs]
  );

  // Load state from localStorage
  const load = useCallback((): (AutoSaveState & { savedAt: number }) | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      
      // Check if saved data is too old (more than 24 hours)
      const MAX_AGE = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.savedAt > MAX_AGE) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  }, [storageKey]);

  // Clear saved state
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }, [storageKey]);

  // Check if there's a saved session
  const hasSavedSession = useCallback((): boolean => {
    return load() !== null;
  }, [load]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    load,
    clear,
    hasSavedSession,
  };
}

/**
 * Format time since a timestamp for display
 */
export function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "剛剛";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小時前`;
  return `${Math.floor(seconds / 86400)} 天前`;
}

