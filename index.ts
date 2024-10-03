// import {Client} from "discord.js";
import { queryVideos } from "./Youtube/Search";

queryVideos("NMDUB").then((result) => console.log(result))

// const client = new Client({
//     intents: ["Guilds", "GuildMessages", "GuildMessageTyping"]
// })