import { beforeEach, describe, expect, it } from 'vitest'
import { decksApi } from './decksApi'

beforeEach(() => {
  localStorage.clear()
})

describe('decksApi', () => {
  it('starts empty', async () => {
    expect(await decksApi.list()).toEqual([])
  })

  it('creates a deck and lists it', async () => {
    const deck = await decksApi.create({ name: 'Russian', language: 'Russian', color: '#3b82f6' })

    expect(deck.id).toBeTruthy()
    expect(deck.name).toBe('Russian')
    expect(await decksApi.list()).toEqual([deck])
  })

  it('finds a deck by id, or returns null', async () => {
    const deck = await decksApi.create({ name: 'Russian', language: null, color: '#3b82f6' })

    expect(await decksApi.getById(deck.id)).toEqual(deck)
    expect(await decksApi.getById('missing-id')).toBeNull()
  })

  it('updates a deck in place, bumping updatedAt', async () => {
    const deck = await decksApi.create({ name: 'Russian', language: null, color: '#3b82f6' })

    const updated = await decksApi.update(deck.id, { name: 'Russian 101', color: '#22c55e' })

    expect(updated.id).toBe(deck.id)
    expect(updated.name).toBe('Russian 101')
    expect(updated.color).toBe('#22c55e')
    expect(await decksApi.list()).toEqual([updated])
  })

  it('throws when updating a deck that does not exist', async () => {
    await expect(decksApi.update('missing-id', { name: 'x' })).rejects.toThrow()
  })

  it('removes a deck', async () => {
    const deck = await decksApi.create({ name: 'Russian', language: null, color: '#3b82f6' })

    await decksApi.remove(deck.id)

    expect(await decksApi.list()).toEqual([])
  })
})
