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
exports.MessageChain = void 0;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const openai = new openai_1.default({
    apiKey: process.env['OPENAI_API_KEY'],
});
class MessageChain {
    constructor(options) {
        var _a, _b, _c;
        this.chain = (_a = options === null || options === void 0 ? void 0 : options.chain) !== null && _a !== void 0 ? _a : [];
        this.saveLog = (_b = options === null || options === void 0 ? void 0 : options.saveLog) !== null && _b !== void 0 ? _b : false;
        this.logPath = (_c = options === null || options === void 0 ? void 0 : options.logPath) !== null && _c !== void 0 ? _c : "log.txt";
        this.logText = "";
        if (this.saveLog)
            this.writeLog("Chain Created", this.chain);
    }
    writeLog(title, data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logText += "\n" + Date.now() + ": " + title;
            if (data)
                this.logText += " > " + JSON.stringify(data).slice(0, 10000);
            if (this.saveLog)
                yield fs.promises.writeFile(this.logPath, this.logText);
        });
    }
    addUserMessage(text, ...images) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = [{ type: "text", text }];
            if (images)
                content.push(...images);
            const toPush = { role: 'user', content };
            this.chain.push(toPush);
            yield this.writeLog("Push Message To Chain", toPush);
        });
    }
    addModelMessage(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const toPush = { role: 'assistant', content: text };
            this.chain.push(toPush);
            yield this.writeLog("Push Message To Chain", toPush);
        });
    }
    getChain(start = 0, end = this.chain.length) {
        return __awaiter(this, void 0, void 0, function* () {
            const retrieval = this.chain.slice(start, end);
            yield this.writeLog("Chain Retreived from Indices " + start + " to " + end);
            return retrieval;
        });
    }
    queryModel(model = 'gpt-4o', start = 0, end = this.chain.length) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const messages = yield this.getChain(start, end);
            yield this.writeLog("Model '" + model + "' Queried on Chain Indices " + start + " to " + end);
            const resp = (_c = (_b = (_a = (yield openai.chat.completions.create({ messages, model }))) === null || _a === void 0 ? void 0 : _a.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
            if (!resp) {
                yield this.writeLog("Model '" + model + "' Query Failed on Chain Indices " + start + " to " + end);
                throw new Error("Model query failed");
            }
            yield this.writeLog("Model '" + model + "' Query Success on Chain Indices " + start + " to " + end, resp);
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
    describeImage(image, prompt = "Describe this image") {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            this.writeLog("Model 'gpt-4o' Queried on Image Description Prompt: " + prompt, image);
            const resp = (_c = (_b = (_a = (yield openai.chat.completions.create({
                messages: [{
                        role: 'user',
                        content: [{ type: "text", text: prompt }, image]
                    }],
                model: "gpt-4o"
            }))) === null || _a === void 0 ? void 0 : _a.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
            if (!resp)
                throw new Error('Model query failed');
            yield this.writeLog("Model 'gpt-4o' Query Success on Image Description", resp);
            return resp;
        });
    }
    describeImagesAsync(images, prompt = "Describe this image") {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = [];
            for (let image of images) {
                const desc = yield this.describeImage(image, prompt);
                resp.push(desc);
            }
            return resp;
        });
    }
}
exports.MessageChain = MessageChain;
