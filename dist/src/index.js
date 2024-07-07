"use strict";
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
exports.Build = void 0;
const openai_1 = __importDefault(require("openai"));
require('dotenv').config();
const scraper_1 = require("./scraper");
const CLIENT_INSTAGRAM_HANDLE = "ocean.rayz";
const openai = new openai_1.default({
    apiKey: process.env['OPENAI_API_KEY'],
});
class MessageChain {
    constructor() {
        this.chain = [];
    }
    addUserMessage(text, ...images) {
        const content = [{ type: "text", text }];
        if (images)
            content.push(...images);
        this.chain.push({ role: 'user', content });
    }
    addModelMessage(text) {
        this.chain.push({ role: 'assistant', content: text });
    }
    getChain(start = 0, end = this.chain.length) {
        return this.chain.slice(start, end);
    }
    static ToImage(url) {
        return {
            type: "image_url",
            image_url: { "url": url }
        };
    }
    static ToImages(urls) {
        return urls.map(url => this.ToImage(url));
    }
}
function Build() {
    return __awaiter(this, void 0, void 0, function* () {
        const igdata = yield (0, scraper_1.instagramScraper)(CLIENT_INSTAGRAM_HANDLE);
        console.log("IG Handle scraped lfg");
        const textPrompt = `I will give you the Instagram page for @${CLIENT_INSTAGRAM_HANDLE}. I am making a simple single page website for this user. Explain what the user would want in such a  <bio>${igdata.bio}</bio>`;
        // Create list of images for model to parse
        const images = MessageChain.ToImages([igdata.profilePicture, ...igdata.thumbnails.slice(0, 8)]);
        // Array full of chronological messages sent between model and script
        const messageChain = new MessageChain();
        messageChain.addUserMessage(textPrompt, ...images);
        const siteDesign = (yield openai.chat.completions.create({ messages: messageChain.getChain(), model: 'gpt-4o' })).choices[0].message.content;
        if (!siteDesign)
            throw new Error("FUCK");
        messageChain.addModelMessage(siteDesign);
        console.log(siteDesign);
    });
}
exports.Build = Build;
