import { useCallback, useLayoutEffect, useState } from 'react'

export default function useLocalStorage(key: string) {
  const [data, setData] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  })

  const handleSetData = useCallback(
    (data: string) => {
      setData((prev) => (data !== prev ? data : prev))
      global.window.localStorage.setItem(key, data)
    },
    [key],
  )

  const handleResetData = useCallback(() => {
    setData(null)
    global.window.localStorage.removeItem(key)
  }, [key])

  const handleLocalStorageChange = useCallback(
    (ev: StorageEvent) => {
      if (ev.key === key && ev.newValue !== ev.oldValue) {
        setData(ev.newValue)
      }
    },
    [key],
  )

  useLayoutEffect(() => {
    window.addEventListener('storage', handleLocalStorageChange)

    return () => {
      window.removeEventListener('storage', handleLocalStorageChange)
    }
  }, [handleLocalStorageChange])

  return [data, handleSetData, handleResetData] as const
}
