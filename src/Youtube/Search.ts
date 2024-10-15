import axios from 'axios'
import { SearchResult } from './SearchResult.type'
import { VideoMetadata } from './types/SearchResult.type'

const YoutubeAPI = axios.create({
    baseURL: process.env.YOUTUBE_URL,
})

export const queryVideos = (query: string): Promise<VideoMetadata[]> =>
    YoutubeAPI.get<SearchResult>(`search`, {
        params: {
            part: 'snippet',
            type: 'video',
            key: process.env.YOUTUBE_API_KEY,
            q: query,
        },
    }).then((res) =>
        res.data.items.map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
        }))
    )
