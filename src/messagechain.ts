import OpenAI from "openai";
import { ChatCompletionContentPartImage, ChatCompletionMessageParam } from "openai/resources";
import * as fs from "fs";

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

type MessageChainOptions = {
    chain?: ChatCompletionMessageParam[],
    saveLog?: boolean;
    logPath?: string;
}

export class MessageChain {
    chain: ChatCompletionMessageParam[];
    saveLog: boolean;
    logPath: string;
    private logText: string;

    constructor(options?: MessageChainOptions) {
        this.chain = options?.chain ?? [];
        this.saveLog = options?.saveLog ?? false;
        this.logPath = options?.logPath ?? "log.txt";
        this.logText = "";

        if(this.saveLog) this.writeLog("Chain Created", this.chain);
    }

    private async writeLog(title: string, data?: any) {
        this.logText += "\n" + Date.now() + ": " + title;
        if(data) this.logText += " > " + JSON.stringify(data).slice(0, 10000);
        if(this.saveLog) await fs.promises.writeFile(this.logPath, this.logText);
    }

    async addUserMessage(text: string, ...images:  ChatCompletionContentPartImage[]) {
        const content: ChatCompletionMessageParam["content"] = [{ type: "text", text }];
        if(images) content.push(...images);

        const toPush = { role: 'user', content } as ChatCompletionMessageParam;
        this.chain.push(toPush);
        await this.writeLog("Push Message To Chain", toPush);
    }

    async addModelMessage(text: string) {
        const toPush = { role: 'assistant', content: text } as ChatCompletionMessageParam;
        this.chain.push(toPush);
        await this.writeLog("Push Message To Chain", toPush);
    }

    async getChain(start: number = 0, end: number = this.chain.length) {
        const retrieval = this.chain.slice(start, end);
        await this.writeLog("Chain Retreived from Indices " + start + " to " + end);
        return retrieval;
    }

    async queryModel(model: string = 'gpt-4o', start: number = 0, end: number = this.chain.length): Promise<string> {
        const messages = await this.getChain(start, end);
        await this.writeLog("Model '" + model + "' Queried on Chain Indices " + start + " to " + end);

        const resp = (await openai.chat.completions.create({ messages, model }))?.choices[0]?.message?.content;
        if(!resp) {
            await this.writeLog("Model '" + model + "' Query Failed on Chain Indices " + start + " to " + end);
            throw new Error("Model query failed");
        }

        await this.writeLog("Model '" + model + "' Query Success on Chain Indices " + start + " to " + end, resp);
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

    
    async describeImage(image: ChatCompletionContentPartImage, prompt: string = "Describe this image"): Promise<string> {
        this.writeLog("Model 'gpt-4o' Queried on Image Description Prompt: " + prompt, image);

        const resp = (await openai.chat.completions.create({
            messages: [{
                role: 'user',
                content: [{ type: "text", text: prompt }, image]
            }],
            model: "gpt-4o"
        }))?.choices[0]?.message?.content;

        if(!resp) throw new Error('Model query failed');

        await this.writeLog("Model 'gpt-4o' Query Success on Image Description", resp);
        return resp;
    }

    async describeImagesAsync(images: ChatCompletionContentPartImage[], prompt: string = "Describe this image"): Promise<string[]> {
        const resp = [];

        for(let image of images) {
            const desc = await this.describeImage(image, prompt);
            resp.push(desc); 
        }

        return resp;
    }
}