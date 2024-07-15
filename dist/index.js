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
const src_1 = require("./src");
const prompt_sync_1 = __importDefault(require("prompt-sync"));
const path = __importStar(require("path"));
const prompt = (0, prompt_sync_1.default)();
const bg = "\x1b[46m\x1b[30m";
const reset = "\x1b[0m";
const fg = "\x1b[34m";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(bg + " ---=--== SiteGEN ==--=--- " + reset);
        const CLIENT_INSTAGRAM_HANDLE = prompt(fg + "Instagram handle: @");
        if (!CLIENT_INSTAGRAM_HANDLE)
            throw new Error("Please enter Instagram handle");
        const PHOTO_COUNT = parseInt(prompt(fg + "Photo Scrape Count (default 10): ")) || 10;
        yield (0, src_1.Build)(CLIENT_INSTAGRAM_HANDLE, PHOTO_COUNT);
        console.log(`\x1b]8;;${path.resolve("build/index.html")}\x1b\\/build/index.html\x1b]8;;\x1b\\`);
        const url = `\x1b]8;;${path.resolve("build/index.html")}\x1b\\/build/index.html\x1b]8;;\x1b\\`;
        console.log(`${fg}Website generated under ${bg}${url}${reset}\n${fg}Thank you for using SiteGEN${reset}`);
    });
}
main();
