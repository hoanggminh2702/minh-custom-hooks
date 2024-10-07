import { renderHook } from '@testing-library/react'
import { useDebounceState } from '../src/index'

import 'jest-canvas-mock'

describe('use previous state', () => {
  it('renders without crashing', () => {
    const { result } = renderHook(() => useDebounceState(''))
    expect(result.current.actualState).toBe('')
  })
})
