import { EffectCallback, useEffect } from 'react'

export default function useMount(fn: EffectCallback) {
  useEffect(() => {
    return fn()
  }, [])
}
