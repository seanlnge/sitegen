import { Build, Options, ReviseBuild } from "./src";
import Prompt from "prompt-sync";
import * as path from "path";
import { Templates } from "./src/template";
const prompt = Prompt();

// I love console codes
const bg = "\x1b[46m\x1b[30m";
const reset = "\x1b[0m";
const fg = "\x1b[34m";
const err = "\x1b[41m";

let start = Date.now();

/**
 * Prints new line
 */
const nl = () => console.log('');


/**
 * Log text with timestamp from start of SiteGEN build
 * @param text Text to log
 */
export const log = (text: string) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);

/**
 * Print and catch error in program
 * @param text Text to log in error style
 * @param exit Exit the program?
 * @returns Error containing text
 */
export const error = (text: string, exit: boolean = true) => {
    console.log(err + text + reset);
    if(exit) process.exitCode = 1;
    return new Error(text);
};

/**
 * Ask user something
 * @param m Message to ask
 * @param after Response prefix text
 * @returns User's response
 */
const ask = (m: string, after: string = "") => prompt(fg + m + reset + after);

/**
 * Literally runs program
 */
async function main() {
    console.log(bg + " ---=--== SiteGEN ==--=--- " + reset);

    const CLIENT_INSTAGRAM_HANDLE = ask("Instagram handle: ", "@");
    if(!CLIENT_INSTAGRAM_HANDLE) return error("Please enter Instagram handle");

    const OPTIONS: Options = {
        template: undefined,
        photoCount: 10,
        model: 'gpt-4o',
        autoRevise: true,
    };

    if(ask("Advanced settings y/(n): ").toLowerCase()[0] == "y") {
        nl();
        let photoCount = parseInt(ask("Photo Count (default 10): "));
        if(photoCount === 0 || photoCount && Number.isNaN(photoCount)) {
            error("Invalid photo count, defaulting to 10");
            photoCount = 10;
        }
        if(photoCount) OPTIONS.photoCount = photoCount;

        nl();
        console.log(fg + "Auto revision takes ~25 seconds and fixes most first build design issues");
        let autoRevise = ask("Run auto revision cycle (y)/n: ").toLowerCase()[0];
        if(autoRevise == "n") {
            OPTIONS.autoRevise = false;
        }
        
        nl();
        console.log(fg + "Template names: " + reset + Object.keys(Templates).map(x => `\x1b]8;;https://html5up.net/uploads/demos/${x}/\x1b\\${x}\x1b]8;;\x1b\\`).join(', ') + reset);
        let template: string | undefined = ask("Choose your template (default auto): ").toLowerCase();
        if(template && !Object.keys(Templates).includes(template)) {
            error("Invalid template name, defaulting to auto");
            template = undefined;
        }
        if(template) OPTIONS.template = template as Options["template"];
        
        nl();
        console.log(fg + "OpenAI models: " + reset + "gpt-4o, gpt-4o-mini, gpt-4-turbo");
        let model = ask("Choose model (default 'gpt-4o'): ").toLowerCase();
        if(model && !["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"].includes(model)) {
            error("Invalid model name, defaulting to 'gpt-4o'");
            model = "gpt-4o";
        }
        if(model) OPTIONS.model = model as Options["model"];
    }

    nl();
    start = Date.now();
    const build = await Build(CLIENT_INSTAGRAM_HANDLE, OPTIONS);
    nl();
    const url = `\x1b]8;;${path.resolve("build/index.html")}\x1b\\ /build/index.html \x1b]8;;\x1b\\`;
    console.log(`${fg}Website generated under ${reset}${url}${reset}`);
    
    nl();
    let chain = build.messageChain;
    while(ask("Revise Site y/(n): ").toLowerCase()[0] == "y") {
        const comments = ask("Any revision comments: ");
        start = Date.now();

        chain = await ReviseBuild(
            chain,
            build.template,
            comments,
            OPTIONS
        );

        console.log(`${fg}Website revised under ${reset}${url}${reset}`);
    }

    nl();
    console.log(`\n${fg}Thank you for using SiteGEN${reset}`);
}
main();