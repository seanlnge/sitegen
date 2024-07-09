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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Build = void 0;
require('dotenv').config();
const fs = __importStar(require("fs"));
const utils_1 = require("./utils");
const messagechain_1 = require("./messagechain");
const template_1 = require("./template");
const start = Date.now();
const log = (text) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);
function Build(igHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        //const igdata = await instagramScraper(igHandle) as Record<string, any>;
        //fs.writeFile("igdata.json", JSON.stringify(igdata), () => {});
        const igdata = JSON.parse(fs.readFileSync("igdata.json").toString());
        log("Instagram scraped, choosing template");
        const textPrompt = `I will give you the Instagram page for @${igHandle}. Pretend you are this user and you are wanting a simple landing page for your Instagram profile. This website will exclusively be a static single page landing website to showcase the client's content. Explain what you would like in such a website, such as the theme, the style, and what information to put into the site. <bio>${igdata.bio}</bio>`;
        // Create list of images for model to parse
        const images = messagechain_1.MessageChain.ToImagesURL([igdata.profilePicture, ...igdata.thumbnails.slice(0, 7)]);
        // Array full of chronological messages sent between model and script
        const messageChain = new messagechain_1.MessageChain({ saveLog: true, logPath: 'log.txt' });
        yield messageChain.addUserMessage(textPrompt, ...images);
        // Get prefered design for website
        const siteDesign = yield messageChain.queryModel();
        yield messageChain.addModelMessage(siteDesign);
        log("Prefered design found, choosing template");
        // Share pictures of template to model and find best suited site
        const templateImages = messagechain_1.MessageChain.ToImagesB64(['templates/directive/directive.png', 'templates/strata/strata.png']);
        const templatePrompt = `I have 2 website templates to choose from, Directive, and Strata. Pick which website template would work the best with this client. Respond in JSON adhering to the following format <json>{ "templateName": "directive" | "strata" }</json>`;
        yield messageChain.addUserMessage(templatePrompt, ...templateImages);
        const design = yield messageChain.queryModel();
        const designJSON = (0, utils_1.jsonParse)(design);
        messageChain.chain.pop(); // we dont need that guy anymore
        log("Template chosen, describing images");
        // Get code for specific design
        const siteName = designJSON["templateName"];
        if (siteName != "directive" && siteName != "strata")
            throw new Error("broooo mf made up its own template");
        const template = new template_1.TemplateBuilder(siteName);
        // Fill images inside website
        const imageDescriptions = yield messageChain.describeImagesAsync(images.slice(1), "Describe this image in a paragraph, including the color scheme, the main item present in this image, and the overall feeling that this image presents.");
        const imageMap = {};
        imageDescriptions.forEach((imageDesc, index) => imageMap["image" + index] = imageDesc);
        log("Images described, placing images");
        const imageFillPrompt = `I will give you a picture of the website template that would work best to match this client's needs. I will also give you a list of images and their respective descriptions. Choose which images should go into which spots to make the best website for the client. Also write a short alt text describing the image. Respond in JSON adhering to the following format <json>{ "IMAGE_A": { "title": "string representing which image goes in IMAGE_A", "alt": "short alt text summarizing description" }, "IMAGE_B": ... }</json>. Here are the images: <json>${imageMap}</json>`;
        yield messageChain.addUserMessage(imageFillPrompt, messagechain_1.MessageChain.ToImageB64(`templates/${siteName}/showcase.png`));
        const fill = yield messageChain.queryModel();
        yield messageChain.addModelMessage(fill);
        log("Images placed, building website");
        const fillJSON = (0, utils_1.jsonParse)(fill);
        const imageTags = {};
        for (let i = 0; i < Object.keys(fillJSON).length; i++) {
            const image = Object.keys(fillJSON)[i];
            imageTags[image] = {
                source: images.slice(1)[i].image_url.url,
                alt: fillJSON[image].alt,
            };
        }
        template.setImages(imageTags);
        // Share HTML code and ask to change template to fit best
        const websitePrompt = `I will give you the HTML code to the website template. Alter this template's text to make the best possible website for the client. This will be the finished product so make sure that everything is filled out. You must follow the rules exactly. Here is the template: <HTMLCode>${template.html}</HTMLCode> <rules>Do not alter any image tags. Do not change the src of an image tag. Respond in XML format as such: <HTMLCode></HTMLCode>. Do not leave any of the filler, lorem ipsum, text.</rules>`;
        yield messageChain.addUserMessage(websitePrompt);
        const website = yield messageChain.queryModel();
        // Svae HTML and build template
        const adjustedHTML = (0, utils_1.xmlParse)(website, "HTMLCode");
        if (adjustedHTML == null)
            throw new Error("mf forgot to write HTML");
        template.setHTML(adjustedHTML);
        yield template.build();
        log("Website built");
    });
}
exports.Build = Build;
