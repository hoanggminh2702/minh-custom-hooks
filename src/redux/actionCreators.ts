/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable prefer-const */

type B<T> = T extends string ? T : never

type RemoveFirstElement<B extends any[]> = B extends [] ? [] : B extends [unknown, ...infer S] ? S : never

// type ConvertNeverArgsToEmptyArgs<TArgs extends any[] | never> = TArgs extends never ? [] : TArgs

export default function actionCreators<
  TPrefix extends string,
  TInitState extends any,
  TActions extends Record<string, (...args: [state: TInitState, ...any[]]) => TInitState>,
>(prefix: TPrefix, initState: TInitState, actions: TActions) {
  let generateActions: any = {}

  ;(Object.keys(actions) as B<keyof TActions>[]).forEach((key) => {
    generateActions[key] = (...args: [...Omit<Parameters<TActions[typeof key]>, '0'>]) => {
      return {
        type: `${prefix}/${key}`,
        payload: [...args],
      }
    }
  })

  const reducer = (
    state = initState,
    action: {
      type: `${TPrefix}/${B<keyof TActions>}`
      payload?: any
    },
  ) => {
    const reducerActions = { ...actions }

    if (typeof reducerActions?.[action.type?.replace(`${prefix}/`, '')] === 'function') {
      return reducerActions[action.type?.replace(`${prefix}/`, '')](state, ...action?.payload)
    }

    return state
  }

  return {
    reducer,
    generateActions: generateActions as {
      [index in B<keyof TActions>]: (...args: [...RemoveFirstElement<Parameters<TActions[index]>>]) => {
        type: `${TPrefix}/${index}`
        payload?: [...RemoveFirstElement<Parameters<TActions[index]>>]
      }
    },
  }
}
