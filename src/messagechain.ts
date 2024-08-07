import OpenAI from "openai";
import { ChatCompletionContentPartImage, ChatCompletionMessageParam } from "openai/resources";
import * as fs from "fs";
import { sleep } from "./utils";
import { error } from "..";

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

    private writeLog(title: string, data?: any) {
        this.logText += "\n" + Date.now() + ": " + title;
        if(data) this.logText += " > " + JSON.stringify(data).slice(0, 10000);
        if(this.saveLog) fs.writeFileSync(this.logPath, this.logText);
    }

    addUserMessage(text: string, ...images:  ChatCompletionContentPartImage[]) {
        const content: ChatCompletionMessageParam["content"] = [{ type: "text", text }];
        if(images) content.push(...images);

        const toPush = { role: 'user', content } as ChatCompletionMessageParam;
        this.chain.push(toPush);
        this.writeLog("Push Message To Chain", toPush);
    }

    addModelMessage(text: string) {
        const toPush = { role: 'assistant', content: text } as ChatCompletionMessageParam;
        this.chain.push(toPush);
        this.writeLog("Push Message To Chain", toPush);
    }

    addSystemMessage(text: string) {
        const toPush = { role: 'system', content: text } as ChatCompletionMessageParam;
        this.chain.push(toPush);
        this.writeLog("Push Message To Chain", toPush);
    }

    getChain(start: number = 0, end: number = this.chain.length) {
        const retrieval = this.chain.slice(start, end);
        this.writeLog("Chain Retreived from Indices " + start + " to " + end);
        return retrieval;
    }

    popChain() {
        const popped = this.chain.pop();
        this.writeLog("Message Popped From Chain", popped);
        return popped;
    }

    resetChain() {
        this.writeLog("Chain emptied and reset");
        this.chain = [];
    }

    async promptImageGenerator(prompt: string): Promise<string> {
        this.writeLog("Image Generator Prompted", prompt);

        const img = await openai.images.generate({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
        });
        if(!img) throw new Error("image gen not work :(");
        
        this.writeLog("Image Generation Success", img.data[0].url);
        return img.data[0].url!;
    }

    async queryModel(model: string = 'gpt-4o', json: boolean = false, start: number = 0, end: number = this.chain.length): Promise<string> {
        const messages = this.getChain(start, end);
        this.writeLog("Model '" + model + "' Queried on Chain Indices " + start + " to " + end);

        const resp = (await openai.chat.completions.create({
            messages,
            model,
            response_format: {
                type: json ? "json_object" : "text"
            }
        }))?.choices[0]?.message?.content;
        if(!resp) {
            this.writeLog("Model '" + model + "' Query Failed on Chain Indices " + start + " to " + end);
            throw new Error("Model query failed");
        }

        this.writeLog("Model '" + model + "' Query Success on Chain Indices " + start + " to " + end, resp);
        return resp;
    }

    static ToImageURL(url: string, lowResolution?: boolean): ChatCompletionContentPartImage {
        return {
            type: "image_url",
            image_url: { url, detail: lowResolution == undefined ? "auto" : lowResolution ? "low" : "high"  },
            
        };
    }

    static ToImagesURL(urls: string[], lowResolution?: boolean): ChatCompletionContentPartImage[] {
        return urls.map(url => this.ToImageURL(url, lowResolution));
    }

    static ToImageB64(url: string | Buffer, lowResolution?: boolean): ChatCompletionContentPartImage {
        const bufferStr = Buffer.isBuffer(url) ? url.toString('base64') : fs.readFileSync(url).toString('base64');
        const extension = Buffer.isBuffer(url) ? 'jpeg' : url.split('.').pop();

        return {
            type: "image_url",
            image_url: {
                url: `data:image/${extension};base64,${bufferStr}`,
                detail: lowResolution == undefined ? "auto" : lowResolution ? "low" : "high" 
            }
        }
    }

    static ToImagesB64(urls: string[], lowResolution?: boolean): ChatCompletionContentPartImage[] {
        return urls.map(url => this.ToImageB64(url, lowResolution));
    }

    
    async describeImage(image: ChatCompletionContentPartImage, prompt: string = "Describe this image", model: string = 'gpt-4o'): Promise<string> {
        this.writeLog("Model '" + model  + "' Queried on Image Description Prompt: " + prompt, image);

        const resp = (await openai.chat.completions.create({
            messages: [{
                role: 'user',
                content: [{ type: "text", text: prompt }, image]
            }],
            model
        }))?.choices[0]?.message?.content;

        if(!resp) throw new Error('Model query failed');

        this.writeLog("Model '" + model + "' Query Success on Image Description", resp);
        return resp;
    }

    async describeImages(images: ChatCompletionContentPartImage[], prompt: string = "Describe this image", model: string = 'gpt-4o'): Promise<string[]> {
        const descriptions = await Promise.all(
            images.map(image => 
                Promise.race([
                    this.describeImage(image, prompt, model),
                    sleep(15000)
                ])
            )
        );
        
        return descriptions.filter(x => typeof x == 'string' ? true : false) as string[];
    }

    async describeImagesAsync(images: ChatCompletionContentPartImage[], prompt: string = "Describe this image", model: string = 'gpt-4o'): Promise<string[]> {
        const resp = [];

        for(let image of images) {
            const desc = await this.describeImage(image, prompt, model);
            if(!desc) continue;
            resp.push(desc);
        }

        return resp;
    }
}