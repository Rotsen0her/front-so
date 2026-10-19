import { useCallback, useEffect, useState } from "react"

import { getJson } from "@/lib/api"

interface FetchState<T> {
  key: string | null
  data: T | null
  error: Error | null
}

/** Pide `url` cada vez que cambia. `null` no hace nada. */
export function useFetch<T>(url: string | null) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<FetchState<T>>({
    key: null,
    data: null,
    error: null,
  })
  const key = url ? `${url}#${attempt}` : null

  useEffect(() => {
    if (!url || !key) return
    const controller = new AbortController()
    getJson<T>(url, controller.signal)
      .then((data) => setState({ key, data, error: null }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return
        setState({ key, data: null, error })
      })
    return () => controller.abort()
  }, [url, key])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const isCurrent = state.key === key

  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    loading: url !== null && !isCurrent,
    reload,
  }
}
