import axios from 'axios'
import { SearchResult, VideoMetadata } from './types'
import { Logger } from '../Logger'
import { debounce } from '../Utilities'

const url = process.env.YOUTUBE_URL
const apiKey = process.env.YOUTUBE_API_KEY

if (!url || !apiKey) {
    Logger.error('Missing Youtube URL / API key')
    throw new Error('Missing env var')
}

const YoutubeAPI = axios.create({
    baseURL: url,
})

export const queryVideos = debounce(
    (query: string): Promise<VideoMetadata[]> =>
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
                title: item.snippet.title,
                description: item.snippet.description,
            }))
        )
)

export const getVideoMetadata = debounce(
    (id: string): Promise<VideoMetadata> =>
        YoutubeAPI.get(`videos`, {
            params: {
                part: 'snippet',
                type: 'video',
                key: apiKey,
                id,
            },
        }).then((res) => {
            console.log(res)
            return res.data.items.map((item: any) => ({
                id,
                title: item.snippet.title,
                description: item.snippet.description,
            }))
        })
)
