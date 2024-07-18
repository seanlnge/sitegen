import { AdvancedOptions, Build, ReviseBuild } from "./src";
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

    const ADV_OPTIONS: AdvancedOptions = {
        template: 'auto',
        model: 'gpt-4o'
    };
    if(ask("Advanced settings (y/n): ").toLowerCase()[0] == "y") {
        console.log(fg + "Template names: " + reset + Object.keys(Templates).map(x => `\x1b]8;;https://html5up.net/uploads/demos/${x}/\x1b\\${x}\x1b]8;;\x1b\\`).join(', ') + reset);
        ADV_OPTIONS.template = ask("Choose your template (default auto): ").toLowerCase() as AdvancedOptions['template'] || ADV_OPTIONS.template;
        console.log(fg + "OpenAI models: " + reset + "gpt-4o, gpt-4o-mini");
        ADV_OPTIONS.model = ask("Choose model (default gpt-4o): ").toLowerCase() as AdvancedOptions['model'] || ADV_OPTIONS.model;
    }
    
    start = Date.now();
    const build = await Build(CLIENT_INSTAGRAM_HANDLE, PHOTO_COUNT, ADV_OPTIONS);
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