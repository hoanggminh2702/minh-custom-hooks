import { useCallback, useLayoutEffect, useState } from 'react'

export default function useLocalStorage(key: string) {
  if (!global?.window?.localStorage) throw new Error('Must be used on client!')

  const [data, setData] = useState(() => {
    const getDataFromStorage = global.window.localStorage.getItem(key)
    return getDataFromStorage
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

  const handleLocalStorageChange = useCallback((ev: StorageEvent) => {
    ev.newValue !== ev.oldValue && setData((prev) => (prev !== ev.newValue ? ev.newValue : prev))
  }, [])

  useLayoutEffect(() => {
    window.addEventListener('storage', handleLocalStorageChange)

    return () => {
      window.removeEventListener('storage', handleLocalStorageChange)
    }
  }, [handleLocalStorageChange])

  return [data, handleSetData, handleResetData] as const
}
