import OpenAI from 'openai';
require('dotenv').config();
import { instagramScraper } from './scraper';
import { ChatCompletionContentPartImage, ChatCompletionMessageParam } from 'openai/resources';
import * as fs from 'fs';
import { jsonParse } from './utils';

const CLIENT_INSTAGRAM_HANDLE = "ocean.rayz";

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

class MessageChain {
    chain: ChatCompletionMessageParam[];

    constructor() {
        this.chain = [];
    }

    addUserMessage(text: string, ...images:  ChatCompletionContentPartImage[]) {
        const content: ChatCompletionMessageParam["content"] = [{ type: "text", text }];
        if(images) content.push(...images);

        this.chain.push({ role: 'user', content });
    }

    addModelMessage(text: string) {
        this.chain.push({ role: 'assistant', content: text });
    }

    getChain(start: number = 0, end: number = this.chain.length) {
        return this.chain.slice(start, end);
    }

    async queryModel(model: string = 'gpt-4o', start: number = 0, end: number = this.chain.length): Promise<string> {
        const messages = this.getChain(start, end);
        const resp = (await openai.chat.completions.create({ messages, model }))?.choices[0]?.message?.content;
        if(!resp) throw new Error('Model query failed');
        return resp;
    }

    static ToImageURL(url: string): ChatCompletionContentPartImage {
        return {
            type: "image_url",
            image_url: { "url": url }
        };
    }

    static ToImagesURL(urls: string[]): ChatCompletionContentPartImage[] {
        return urls.map(url => this.ToImageURL(url));
    }

    static ToImageB64(url: string): ChatCompletionContentPartImage {
        const bufferStr = fs.readFileSync(url).toString('base64');
        const extension = url.split('.').pop();

        return {
            type: "image_url",
            image_url: { "url": `data:image/${extension};base64,${bufferStr}` }
        }
    }

    static ToImagesB64(urls: string[]): ChatCompletionContentPartImage[] {
        return urls.map(url => this.ToImageB64(url));
    }
}

export async function Build() {
    const igdata = await instagramScraper(CLIENT_INSTAGRAM_HANDLE) as Record<string, any>;
    console.log("IG Handle scraped lfg");

    const textPrompt = `I will give you the Instagram page for @${CLIENT_INSTAGRAM_HANDLE}. Pretend you are this user and you are wanting a simple landing page for your Instagram profile. Explain what you would like in such a website, such as the theme, the style, and what information to put into the site. <bio>${igdata.bio}</bio>`;
    
    // Create list of images for model to parse
    const images = MessageChain.ToImagesURL([igdata.profilePicture, ...igdata.thumbnails.slice(0, 8)]);

    // Array full of chronological messages sent between model and script
    const messageChain = new MessageChain();
    messageChain.addUserMessage(textPrompt, ...images);

    // Get prefered design for website
    const siteDesign = await messageChain.queryModel();
    messageChain.addModelMessage(siteDesign);
    console.log(siteDesign);

    // Share pictures of template to model and find best suited site as well as best suited theme
    const templateImages = MessageChain.ToImagesB64([__dirname + '/../../media/directive.png', __dirname + '/../../media/strata.png']);
    const templatePrompt = `I have 2 website templates to choose from, Directive, and Strata. Pick which website template would work the best with this client, as well as the best color palette that would work with this client. I will provide you the JSON, and all you have to do is fill it out and return. <json>{ "templateName": "directive" | "strata", "primaryColor": string, "secondaryColor1": string, "secondaryColor2": string }</json>`;
    messageChain.addUserMessage(templatePrompt, ...templateImages);
    
    const design = await messageChain.queryModel();
    console.log(design);
    messageChain.addModelMessage(design);
    const designJSON = jsonParse(design);

    // Share html code and ask to change template to fit best

    // Change theme and template in css and html to fit the website the best
}