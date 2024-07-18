import { Build, ReviseBuild } from "./src";
import Prompt from "prompt-sync";
import * as path from "path";
import { Templates } from "./src/template";
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

const ask = (m: string, after: string = "") => prompt(fg + m + reset + after);

async function main() {
    console.log(bg + " ---=--== SiteGEN ==--=--- " + reset);

    const CLIENT_INSTAGRAM_HANDLE = ask("Instagram handle: ", "@");
    if(!CLIENT_INSTAGRAM_HANDLE) return error("Please enter Instagram handle");

    const PHOTO_COUNT = parseInt(ask("Photo scrape count (default 10): ")) || 10;

    let template;
    if(ask("Choose Template (y/n): ").toLowerCase()[0] == "y") {
        console.log(fg + "Template names: " + reset + Object.keys(Templates).map(x => `\x1b]8;;https://html5up.net/uploads/demos/${x}/\x1b\\${x}\x1b]8;;\x1b\\`).join(', ') + reset);
        template = ask("Choose your template: ").toLowerCase();
    }
    
    start = Date.now();
    const build = await Build(CLIENT_INSTAGRAM_HANDLE, PHOTO_COUNT, template);
    const url = `\x1b]8;;${path.resolve("build/index.html")}\x1b\\ /build/index.html \x1b]8;;\x1b\\`;
    console.log(`${fg}Website generated under ${reset}${url}${reset}`);

    let chain = build.messageChain;
    while(ask("Revise Site (y/n): ").toLowerCase()[0] == "y") {
        const comments = ask("Any revision comments: ");
        start = Date.now();

        const reviseChain = await ReviseBuild(
            chain,
            build.template,
            comments,
            chain == build.messageChain
        );
        
        if(!reviseChain) continue;
        chain = reviseChain;

        console.log(`${fg}Website revised under ${reset}${url}${reset}`);
    }
    
    console.log(`\n${fg}Thank you for using SiteGEN${reset}`);
}
main();