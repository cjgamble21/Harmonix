import axios from 'axios'
import {
    SearchMetadata,
    SearchResult,
    VideoDetails,
    VideoMetadata,
} from './types'
import { Logger } from '../Logger'
import { debounce } from '../Utilities'

const url = process.env.YOUTUBE_URL
const apiKeys = process.env.YOUTUBE_API_KEYS

if (!url || !apiKeys) {
    Logger.error('Missing Youtube URL / API key')
    throw new Error('Missing env var')
}

const apiKey = apiKeys.split(';').unshift()

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
                title: item.snippet.title,
                description: item.snippet.description,
            }))
        )
)

export const getVideoMetadata = debounce(
    (id: string): Promise<VideoMetadata> =>
        YoutubeAPI.get<VideoDetails>(`videos`, {
            params: {
                part: ['snippet', 'contentDetails'],
                type: 'video',
                key: apiKey,
                id,
            },
        }).then((res) => {
            console.log(res.data.items[0])
            const [toReturn] = res.data.items.map((item) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                duration: getTimeFromDuration(item.contentDetails.duration),
            }))

            return toReturn
        })
)

const getTimeFromDuration = (duration: string) => {
    const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    return duration
        .replace(durationRegex, '$1:$2:$3')
        .split(':')
        .filter(Boolean)
        .join(':')
}
