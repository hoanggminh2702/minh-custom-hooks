import { useCallback, useState } from 'react'

type UseToggleParams = boolean | (() => boolean) | undefined

export default function useToggle(init: UseToggleParams = false) {
  const [state, setState] = useState(init)

  const on = useCallback(() => {
    setState(true)
  }, [])

  const off = useCallback(() => {
    setState(false)
  }, [])

  const toggle = useCallback(() => {
    setState((prev) => !prev)
  }, [])

  return {
    state,
    on,
    off,
    toggle,
  }
}
