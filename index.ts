import { Build } from "./src";
import Prompt from "prompt-sync";
import * as path from "path";
import { instagramScraper } from "./src/scraper";
const prompt = Prompt();

const bg = "\x1b[46m\x1b[30m";
const reset = "\x1b[0m";
const fg = "\x1b[34m";

let start = Date.now();
export const log = (text: string) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);
export const error = (text: string, exit: boolean = true) => {
    console.log("\x1b[41m" + text + "\x1b[0m");
    if(exit) process.exitCode = 1;
    return new Error(text);
};

async function main() {
    console.log(bg + " ---=--== SiteGEN ==--=--- " + reset);

    const CLIENT_INSTAGRAM_HANDLE = prompt(fg + "Instagram handle: @");
    if(!CLIENT_INSTAGRAM_HANDLE) throw new Error("Please enter Instagram handle");

    const PHOTO_COUNT = parseInt(prompt(fg + "Photo Scrape Count (default 10): ")) || 10;
    
    start = Date.now();
    await Build(CLIENT_INSTAGRAM_HANDLE, PHOTO_COUNT);

    const url = `\x1b]8;;${path.resolve("build/index.html")}\x1b\\ /build/index.html \x1b]8;;\x1b\\`;
    console.log(`${fg}Website generated under ${bg}${url}${reset}\n${fg}Thank you for using SiteGEN${reset}`);
}
main();