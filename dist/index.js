"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.log = void 0;
const src_1 = require("./src");
const prompt_sync_1 = __importDefault(require("prompt-sync"));
const path = __importStar(require("path"));
const template_1 = require("./src/template");
const prompt = (0, prompt_sync_1.default)();
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
const log = (text) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);
exports.log = log;
/**
 * Print and catch error in program
 * @param text Text to log in error style
 * @param exit Exit the program?
 * @returns Error containing text
 */
const error = (text, exit = true) => {
    console.log(err + text + reset);
    if (exit)
        process.exitCode = 1;
    return new Error(text);
};
exports.error = error;
/**
 * Ask user something
 * @param m Message to ask
 * @param after Response prefix text
 * @returns User's response
 */
const ask = (m, after = "") => prompt(fg + m + reset + after);
/**
 * Literally runs program
 */
function main() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(bg + " ---=--== SiteGEN ==--=--- " + reset);
        const HANDLES = {};
        nl();
        console.log(fg + "To skip a handle, click Enter" + reset);
        HANDLES.instagram = (_a = ask("Instagram handle: ", "@")) !== null && _a !== void 0 ? _a : undefined;
        HANDLES.facebook = (_b = ask("Facebook handle: ")) !== null && _b !== void 0 ? _b : undefined;
        const OPTIONS = {
            template: undefined,
            photoCount: 10,
            model: 'gpt-4o',
            autoRevise: true,
        };
        if (ask("Advanced settings y/(n): ").toLowerCase()[0] == "y") {
            nl();
            let photoCount = parseInt(ask("Photo Count (default 10): "));
            if (photoCount === 0 || photoCount && Number.isNaN(photoCount)) {
                (0, exports.error)("Invalid photo count, defaulting to 10");
                photoCount = 10;
            }
            if (photoCount)
                OPTIONS.photoCount = photoCount;
            nl();
            console.log(fg + "Auto revision takes ~25 seconds and fixes most first build design issues");
            let autoRevise = ask("Run auto revision cycle (y)/n: ").toLowerCase()[0];
            if (autoRevise == "n") {
                OPTIONS.autoRevise = false;
            }
            nl();
            console.log(fg + "Template names: " + reset + Object.keys(template_1.Templates).map(x => `\x1b]8;;https://html5up.net/uploads/demos/${x}/\x1b\\${x}\x1b]8;;\x1b\\`).join(', ') + reset);
            let template = ask("Choose your template (default auto): ").toLowerCase();
            if (template && !Object.keys(template_1.Templates).includes(template)) {
                (0, exports.error)("Invalid template name, defaulting to auto");
                template = undefined;
            }
            if (template)
                OPTIONS.template = template;
            nl();
            console.log(fg + "OpenAI models: " + reset + "gpt-4o, gpt-4o-mini, gpt-4-turbo");
            let model = ask("Choose model (default 'gpt-4o'): ").toLowerCase();
            if (model && !["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"].includes(model)) {
                (0, exports.error)("Invalid model name, defaulting to 'gpt-4o'");
                model = "gpt-4o";
            }
            if (model)
                OPTIONS.model = model;
        }
        nl();
        start = Date.now();
        const build = yield (0, src_1.Build)(HANDLES, OPTIONS);
        nl();
        const url = `\x1b]8;;${path.resolve("build/index.html")}\x1b\\ /build/index.html \x1b]8;;\x1b\\`;
        console.log(`${fg}Website generated under ${reset}${url}${reset}`);
        nl();
        let chain = build.messageChain;
        while (ask("Revise Site y/(n): ").toLowerCase()[0] == "y") {
            const comments = ask("Any revision comments: ");
            start = Date.now();
            chain = yield (0, src_1.ReviseBuild)(chain, build.template, comments, OPTIONS);
            console.log(`${fg}Website revised under ${reset}${url}${reset}`);
        }
        nl();
        console.log(`\n${fg}Thank you for using SiteGEN${reset}`);
    });
}
main();
