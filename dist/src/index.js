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
exports.Build = void 0;
const openai_1 = __importDefault(require("openai"));
require('dotenv').config();
const scraper_1 = require("./scraper");
const fs = __importStar(require("fs"));
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
    queryModel(model = 'gpt-4o', start = 0, end = this.chain.length) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const messages = this.getChain(start, end);
            const resp = (_c = (_b = (_a = (yield openai.chat.completions.create({ messages, model }))) === null || _a === void 0 ? void 0 : _a.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
            if (!resp)
                throw new Error('Model query failed');
            return resp;
        });
    }
    static ToImageURL(url) {
        return {
            type: "image_url",
            image_url: { "url": url }
        };
    }
    static ToImagesURL(urls) {
        return urls.map(url => this.ToImageURL(url));
    }
    static ToImageB64(url) {
        const bufferStr = fs.readFileSync(url).toString('base64');
        const extension = url.split('.').pop();
        return {
            type: "image_url",
            image_url: { "url": `data:image/${extension};base64,${bufferStr}` }
        };
    }
    static ToImagesB64(urls) {
        return urls.map(url => this.ToImageB64(url));
    }
}
function Build() {
    return __awaiter(this, void 0, void 0, function* () {
        const igdata = yield (0, scraper_1.instagramScraper)(CLIENT_INSTAGRAM_HANDLE);
        console.log("IG Handle scraped lfg");
        const textPrompt = `I will give you the Instagram page for @${CLIENT_INSTAGRAM_HANDLE}. Pretend you are this user and you are wanting a simple landing page for your Instagram profile. Explain what you would like in such a website, such as the theme, the style, and what information to put into the site. <bio>${igdata.bio}</bio>`;
        // Create list of images for model to parse
        const images = MessageChain.ToImagesURL([igdata.profilePicture, ...igdata.thumbnails.slice(0, 8)]);
        // Array full of chronological messages sent between model and script
        const messageChain = new MessageChain();
        messageChain.addUserMessage(textPrompt, ...images);
        // Get prefered design for website
        const siteDesign = yield messageChain.queryModel();
        messageChain.addModelMessage(siteDesign);
        console.log(siteDesign);
        // Share pictures of template to model and find best suited site as well as best suited theme
        const templateImages = MessageChain.ToImagesB64([__dirname + '/../../media/directive.png', __dirname + '/../../media/strata.png']);
        const templatePrompt = `I have 2 website templates to choose from, Directive, and Strata. Pick which website template would work the best with this client, as well as the best color palette that would work with this client. I will provide you the JSON, and all you have to do is fill it out and return. <json>{ "templateName": "directive" | "strata", "primaryColor": string, "secondaryColor1": string, "secondaryColor2": string }</json>. Now fill out the json <json>`;
        messageChain.addUserMessage(templatePrompt, ...templateImages);
        const design = yield messageChain.queryModel();
        console.log(design);
        messageChain.addModelMessage(design);
        // Share html code and ask to change template to fit best
        // Change theme and template in css and html to fit the website the best
    });
}
exports.Build = Build;
