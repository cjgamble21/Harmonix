import axios from "axios";
import { SearchResult } from "./SearchResult.type";

const YoutubeAPI = axios.create({
    baseURL: process.env.YOUTUBE_URL
})

export const queryVideos = (query: string) => YoutubeAPI.get<SearchResult>(`search`, {
    params: {
        part: "snippet",
        type: "video",
        key: process.env.YOUTUBE_API_KEY,
        q: query
    }
}).then((res) => res.data)