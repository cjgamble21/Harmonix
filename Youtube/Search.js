"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryVideos = void 0;
var axios_1 = require("axios");
var YoutubeAPI = axios_1.default.create({
    baseURL: process.env.YOUTUBE_URL
});
var queryVideos = function (query) { return YoutubeAPI.get("search", {
    params: {
        part: "snippet",
        type: "video",
        key: process.env.YOUTUBE_API_KEY,
        q: query
    }
}).then(function (res) { return res.data; }); };
exports.queryVideos = queryVideos;
