import OpenAI from 'openai';
require('dotenv').config();
import { instagramScraper } from './scraper';
import { ChatCompletionContentPartImage, ChatCompletionMessageParam } from 'openai/resources';
import axios from 'axios';

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

    static ToImage(url: string): ChatCompletionContentPartImage {
        return {
            type: "image_url",
            image_url: { "url": url }
        };
    }

    static ToImages(urls: string[]): ChatCompletionContentPartImage[] {
        return urls.map(url => this.ToImage(url));
    }
}

export async function Build() {
    const igdata = await instagramScraper(CLIENT_INSTAGRAM_HANDLE) as Record<string, any>;
    console.log("IG Handle scraped lfg");

    const textPrompt = `I will give you the Instagram page for @${CLIENT_INSTAGRAM_HANDLE}. I am making a simple single page website for this user. Explain what the user would want in such a  <bio>${igdata.bio}</bio>`;
    
    // Create list of images for model to parse
    const images = MessageChain.ToImages([igdata.profilePicture, ...igdata.thumbnails.slice(0, 8)]);

    // Array full of chronological messages sent between model and script
    const messageChain = new MessageChain();
    messageChain.addUserMessage(textPrompt, ...images);

    const siteDesign = (await openai.chat.completions.create({ messages: messageChain.getChain(), model: 'gpt-4o' })).choices[0].message.content;
    if(!siteDesign) throw new Error("FUCK");
    messageChain.addModelMessage(siteDesign);
    console.log(siteDesign);
}