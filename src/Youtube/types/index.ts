export * from './SearchResult.type'
export * from './Videos.type'

export type VideoMetadata = SearchMetadata

export interface SearchMetadata {
    id: string
    title: string
    description: string
}
