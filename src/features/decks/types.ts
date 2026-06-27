export interface Deck {
  id: string
  name: string
  language: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export interface CreateDeckInput {
  name: string
  language: string | null
  color: string
}

export type UpdateDeckInput = Partial<CreateDeckInput>
