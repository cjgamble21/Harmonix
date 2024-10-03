"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import {Client} from "discord.js";
var Search_1 = require("./Youtube/Search");
(0, Search_1.queryVideos)("NMDUB").then(function (result) { return console.log(result); });
// const client = new Client({
//     intents: ["Guilds", "GuildMessages", "GuildMessageTyping"]
// })
