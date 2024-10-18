export * from './SearchResult.type'
export * from './Videos.type'

export type VideoMetadata = SearchMetadata & { duration: string }

export interface SearchMetadata {
    id: string
    title: string
    description: string
}
