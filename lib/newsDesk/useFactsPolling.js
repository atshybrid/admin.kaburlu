import { useCallback, useEffect, useRef } from 'react'
import newsDeskApi from '../api/services/newsDeskApi'
import { isTerminalExtractionStatus } from './extractionPolling'

const DEFAULT_INTERVAL_MS = 8000

/**
 * Poll GET /facts while extractionStatus is pending. Single in-flight request guard.
 */
export function useFactsPolling({ jobId, enabled = true, intervalMs = DEFAULT_INTERVAL_MS, onUpdate, onError }) {
  const timerRef = useRef(null)
  const inFlightRef = useRef(false)
  const stoppedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const tick = useCallback(async () => {
    if (!jobId || !enabled || stoppedRef.current) return
    if (inFlightRef.current) {
      timerRef.current = setTimeout(tick, intervalMs)
      return
    }
    inFlightRef.current = true
    try {
      const facts = await newsDeskApi.getFacts(jobId)
      onUpdate?.(facts)
      if (facts?.extractionStatus && isTerminalExtractionStatus(facts.extractionStatus)) {
        stoppedRef.current = true
        clearTimer()
        return
      }
    } catch (error) {
      onError?.(error)
    } finally {
      inFlightRef.current = false
      if (!stoppedRef.current && enabled) {
        timerRef.current = setTimeout(tick, intervalMs)
      }
    }
  }, [jobId, enabled, intervalMs, onUpdate, onError, clearTimer])

  const restart = useCallback(() => {
    stoppedRef.current = false
    clearTimer()
    timerRef.current = setTimeout(tick, 400)
  }, [clearTimer, tick])

  const stop = useCallback(() => {
    stoppedRef.current = true
    clearTimer()
  }, [clearTimer])

  useEffect(() => {
    if (!jobId || !enabled) {
      stoppedRef.current = true
      clearTimer()
      return undefined
    }
    stoppedRef.current = false
    inFlightRef.current = false
    timerRef.current = setTimeout(tick, 300)
    return () => {
      stoppedRef.current = true
      clearTimer()
    }
  }, [jobId, enabled, tick, clearTimer])

  return { restart, stop }
}