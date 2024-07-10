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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Build = void 0;
require('dotenv').config();
const scraper_1 = require("./scraper");
const utils_1 = require("./utils");
const messagechain_1 = require("./messagechain");
const template_1 = require("./template");
const start = Date.now();
const log = (text) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);
function Build(igHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        const igdata = yield (0, scraper_1.instagramScraper)(igHandle);
        //fs.writeFile("igdata.json", JSON.stringify(igdata), () => {});
        //const igdata = JSON.parse(fs.readFileSync("igdata.json").toString());
        log("Instagram scraped, choosing template");
        const textPrompt = `I will give you the Instagram page for @${igHandle}. Pretend you are this user. Describe the purpose of your Instagram page, as well as what you would display if you were to turn it into a static single page website. <bio>${igdata.bio}</bio>`;
        // Create list of images for model to parse
        const images = messagechain_1.MessageChain.ToImagesURL([igdata.profilePicture, ...igdata.thumbnails.slice(0, 7)]);
        // Array full of chronological messages sent between model and script
        const messageChain = new messagechain_1.MessageChain({ saveLog: true, logPath: 'log.txt' });
        yield messageChain.addUserMessage(textPrompt, ...images);
        // Get prefered design for website
        const siteDesign = yield messageChain.queryModel();
        yield messageChain.addModelMessage(siteDesign);
        // Share pictures of template to model and find best suited site
        log("Prefered design found, choosing template");
        const templateImages = messagechain_1.MessageChain.ToImagesB64(['templates/directive/directive.png', 'templates/strata/strata.png']);
        const templatePrompt = `I have 2 website templates to choose from, Directive, and Strata. Pick which website template would work the best with this client. Respond in JSON adhering to the following format <json>{ "templateName": "directive" | "strata" }</json>`;
        yield messageChain.addUserMessage(templatePrompt, ...templateImages);
        const design = yield messageChain.queryModel();
        const designJSON = (0, utils_1.jsonParse)(design);
        messageChain.chain.pop(); // we dont need that guy anymore
        // Get code for specific design
        const siteName = designJSON["templateName"];
        if (siteName != "directive" && siteName != "strata")
            throw new Error("broooo mf made up its own template");
        const template = new template_1.TemplateBuilder(siteName);
        // Fill images inside website
        log("Template chosen, describing images");
        const toDescribe = images.slice(1);
        const imgdesc = yield messageChain.describeImagesAsync(toDescribe, "Describe this image in a paragraph, including the color scheme, the main item present in this image, and the overall feeling that this image presents. Also give a short title for this image.");
        const imageDescriptions = imgdesc.map((x, i) => ({ description: x, url: `image${i}.jpg`, source: "" }));
        imageDescriptions.forEach((x, i) => x["url"] = "image" + i + ".jpg");
        log("Images described, placing images");
        const imageFillPrompt = `I will give you a picture of the website template that would work best to match this client's needs. I will also give you a list of images and their respective descriptions. Choose which images should go into which spots to make the best website for the client. Follow the rules exactly. <rules>Do not alter the url of any images at all. Respond in JSON adhering to the following format { "IMAGE_A": url of image that best fits here, "IMAGE_B": ... }</rules>. Here are the image descriptions: ${JSON.stringify(imageDescriptions)}`;
        yield messageChain.addUserMessage(imageFillPrompt, messagechain_1.MessageChain.ToImageB64(`templates/${siteName}/showcase.png`));
        const fill = yield messageChain.queryModel();
        yield messageChain.addModelMessage(fill);
        const fillJSON = (0, utils_1.jsonParse)(fill);
        imageDescriptions.forEach((x, i) => x["source"] = toDescribe[i].image_url.url);
        const imageTags = {};
        for (const url in fillJSON) {
            const img = imageDescriptions.find(x => x["url"] == fillJSON[url]);
            if (!img)
                continue;
            imageTags[url] = img["source"];
        }
        imageTags["IMAGE_Z"] = igdata.profilePicture;
        template.setImages(imageTags);
        // Share HTML code and ask to change template to fit best
        log("Images placed, building website");
        const entryPoints = template.getEntryNameList();
        const websitePrompt = `I will give you the HTML and CSS code to the website template. I will also give you a list of data entry points for you to write into to make the best possible website for the client. This will be the finished product so make sure that everything is filled out. You must follow the rules exactly. Here is the template:\n\`\`\`html\n${template.html}\n\`\`\`\n\`\`\`css\n${template.css}\n\`\`\`. Here are my entry points for you to fill out \`${JSON.stringify(entryPoints)}\` <rules>Respond in JSON format as such: { [key: entry point name]: string to fill spot }. Ensure that for each entry point that I provided, you fill out and put inside the returned JSON. Do not make up any information or assume. If more information is needed to fill a specific area, generalize and make a broad statement.</rules> <example>{ ..., "HEADER": "<strong>Brand Name</strong> we are a company<br />that specializes in awesome", "PARAGRAPH_1": "Lorem ipsum dolor sit amet", ... }</example>`;
        yield messageChain.addUserMessage(websitePrompt);
        const website = yield messageChain.queryModel();
        // Svae HTML and build template
        const dataEntries = (0, utils_1.jsonParse)(website);
        template.setEntryPoints(new Map(Object.entries(dataEntries)));
        yield template.build();
        log("Website built");
    });
}
exports.Build = Build;
