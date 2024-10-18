export interface VideoDetails {
    kind: string
    etag: string
    items: Item[]
    pageInfo: PageInfo
}

interface Item {
    kind: string
    etag: string
    id: string
    snippet: Snippet
    contentDetails: ContentDetails
}

interface Snippet {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: Thumbnails
    channelTitle: string
    tags: string[]
    categoryId: string
    liveBroadcastContent: string
    localized: Localized
}

interface Thumbnails {
    default: Default
    medium: Medium
    high: High
    standard: Standard
    maxres: Maxres
}

interface Default {
    url: string
    width: number
    height: number
}

interface Medium {
    url: string
    width: number
    height: number
}

interface High {
    url: string
    width: number
    height: number
}

interface Standard {
    url: string
    width: number
    height: number
}

interface Maxres {
    url: string
    width: number
    height: number
}

interface Localized {
    title: string
    description: string
}

interface ContentDetails {
    duration: string
    dimension: string
    definition: string
    caption: string
    licensedContent: boolean
    contentRating: ContentRating
    projection: string
}

interface ContentRating {}

interface PageInfo {
    totalResults: number
    resultsPerPage: number
}
