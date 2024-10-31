import axios from 'axios'
import {
    SearchMetadata,
    SearchResult,
    VideoDetails,
    VideoMetadata,
} from './types'
import { Logger } from '../Logger'
import { debounce } from '../Utilities'
import { decode } from 'html-entities'

const url = process.env.YOUTUBE_URL
const apiKey = process.env.YOUTUBE_API_KEY

if (!url || !apiKey) {
    Logger.error('Missing Youtube URL / API key')
    throw new Error('Missing env var')
}

const YoutubeAPI = axios.create({
    baseURL: url,
    paramsSerializer: {
        indexes: null,
    },
})

export const queryVideos = debounce(
    (query: string): Promise<SearchMetadata[]> =>
        YoutubeAPI.get<SearchResult>(`search`, {
            params: {
                part: 'snippet',
                type: 'video',
                key: apiKey,
                q: query,
            },
        }).then((res) =>
            res.data.items.map((item) => ({
                id: item.id.videoId,
                title: decode(item.snippet.title.slice(0, 100)),
                description: item.snippet.description,
            }))
        )
)
