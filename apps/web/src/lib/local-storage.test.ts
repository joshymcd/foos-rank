import { beforeEach, describe, expect, it } from 'vitest'
import { readStoredArray, updateStoredArray } from './local-storage'

const values = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
}

beforeEach(() => {
  values.clear()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  })
})

describe('local storage arrays', () => {
  it('keeps consecutive synchronous updates', () => {
    updateStoredArray<number>('items', (items) => [...items, 1])
    updateStoredArray<number>('items', (items) => [...items, 2])
    updateStoredArray<number>('items', (items) =>
      items.map((item) => (item === 1 ? 3 : item)),
    )
    expect(readStoredArray<number>('items')).toEqual([3, 2])
  })

  it('does not overwrite malformed data', () => {
    values.set('items', '{broken')
    expect(() => updateStoredArray('items', () => [])).toThrow(
      'saved items data is invalid',
    )
    expect(values.get('items')).toBe('{broken')
  })
})
