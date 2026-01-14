"use client";

import { useState, useCallback, useRef } from "react";

interface UseApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

interface UseApiRequestReturn<T> {
  execute: (fetchFn: () => Promise<Response>) => Promise<T | null>;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
}

/**
 * Hook for API requests with retry logic and duplicate request prevention
 */
export function useApiRequest<T = unknown>(
  options: UseApiRequestOptions<T> = {}
): UseApiRequestReturn<T> {
  const { onSuccess, onError, retries = 2, retryDelay = 1000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Prevent duplicate requests
  const isExecutingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const execute = useCallback(
    async (fetchFn: () => Promise<Response>): Promise<T | null> => {
      // Prevent duplicate requests
      if (isExecutingRef.current) {
        console.warn("Request already in progress, ignoring duplicate");
        return null;
      }

      isExecutingRef.current = true;
      setIsLoading(true);
      setError(null);
      setRetryCount(0);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt <= retries) {
        try {
          if (attempt > 0) {
            setIsRetrying(true);
            setRetryCount(attempt);
            await sleep(retryDelay * attempt); // Exponential backoff
          }

          const response = await fetchFn();

          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("Request was cancelled");
          }

          if (!response.ok) {
            // Don't retry client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Request failed: ${response.status}`);
            }
            // Retry server errors (5xx)
            throw new Error(`Server error: ${response.status}`);
          }

          const result = await response.json();
          setData(result);
          setIsLoading(false);
          setIsRetrying(false);
          isExecutingRef.current = false;
          onSuccess?.(result);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Unknown error");
          attempt++;

          // Don't retry if it's a client error or if we've exhausted retries
          if (attempt > retries || (err instanceof Error && err.message.includes("Request failed"))) {
            break;
          }
        }
      }

      // All retries exhausted
      setError(lastError);
      setIsLoading(false);
      setIsRetrying(false);
      isExecutingRef.current = false;
      onError?.(lastError!);
      return null;
    },
    [onSuccess, onError, retries, retryDelay]
  );

  return {
    execute,
    data,
    error,
    isLoading,
    isRetrying,
    retryCount,
  };
}

/**
 * Simple hook to prevent button double-clicks
 */
export function useDebounceSubmit(delayMs: number = 500) {
  const lastSubmitRef = useRef<number>(0);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const canSubmit = useCallback(() => {
    const now = Date.now();
    if (now - lastSubmitRef.current < delayMs) {
      return false;
    }
    lastSubmitRef.current = now;
    return true;
  }, [delayMs]);

  const withDebounce = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (!canSubmit()) {
        console.warn("Submit debounced - too soon after last submit");
        return null;
      }

      setIsDebouncing(true);
      try {
        return await fn();
      } finally {
        // Add a small delay before allowing next submit
        setTimeout(() => setIsDebouncing(false), delayMs);
      }
    },
    [canSubmit, delayMs]
  );

  return { canSubmit, withDebounce, isDebouncing };
}

