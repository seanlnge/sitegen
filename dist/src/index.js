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
exports.Build = exports.ReviseBuild = void 0;
require('dotenv').config();
const scraper_1 = require("./scraper");
const utils_1 = require("./utils");
const messagechain_1 = require("./messagechain");
const template_1 = require("./template");
const __1 = require("..");
const ScraperMap = {
    instagram: scraper_1.instagramScraper,
    facebook: scraper_1.facebookScraper,
};
/**
 * Collection and parse all client information
 * @param messageChain Chain of messages being sent
 * @param igdata Instagram user's data
 * @param options SiteGEN options
 * @returns All information about client parsed into JSON string
 */
function parseClient(messageChain, socialMediaData, images, options) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, __1.log)("Collecting and parsing client information");
        const imgObjs = messagechain_1.MessageChain.ToImagesURL(images.slice(0, options.photoCount).map(x => x.source));
        const socials = Object.keys(socialMediaData).map(name => {
            const data = socialMediaData[name];
            const captions = data.images.map(x => x.caption);
            return `<${name}>\n<bio>\n${data.bio}\n</bio>\n<captions>\n${captions.join('\n')}\n</captions>\n</${name}>`;
        });
        messageChain.addUserMessage(`I will give you the social media data for my client. Turn this information into a JSON object describing this client. Follow all of the rules.\n<rules>Add as much data as you can find into this JSON object. For specific data such as location, contact information, or instagram username, add information into it's own field. Add information about this page's style.</rules>\n<example>\n\`{ "instagram": "@_potterylovers", "address": "201 Main St, Farmington, Maine, 19382", "purpose": "Business that sells pottery lessons", "number": "302-404-1111", "style": "Artisinal and personable", "extraInfo": "Very polished page ran very professionally. The pictures utilize very earthy colors, and include studio shots along with pictures with in-home settings, ..." }\`\n</example> \n<socials>${socials.join('\n')}</socials>`, ...imgObjs);
        // Get prefered design for website
        const client = yield messageChain.queryModel('gpt-4o', true);
        messageChain.popChain();
        messageChain.addUserMessage(`This is my client's Instagram page information: <info>${client}</info>`);
        return client;
    });
}
/**
 * Choose and initialize which template SiteGEN should build onto
 * @param messageChain Chain of messages being sent
 * @param options SiteGEN options
 * @returns Template that site is being built onto
 */
function chooseTemplate(messageChain, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.template)
            return new template_1.TemplateBuilder(options.template);
        (0, __1.log)("Choosing template");
        // Get code for specific design
        const templateImages = messagechain_1.MessageChain.ToImagesB64(Object.keys(template_1.Templates).map(x => `templates/${x}/${x}.png`), true);
        const templatePrompt = `I have ${Object.keys(template_1.Templates).length} website templates to choose from. Pick which website template would work the best with this Instagram page, and why you chose that specific template. Respond in JSON adhering to the following format <json>{ "templateName": ${Object.keys(template_1.Templates).map(x => `"${x}"`).join(" | ")}, "reasoning": string }</json>.`;
        messageChain.addUserMessage(templatePrompt, ...templateImages);
        const design = yield messageChain.queryModel(options.model, true);
        const designJSON = (0, utils_1.jsonParse)(design);
        messageChain.popChain();
        if (!(designJSON["templateName"] in template_1.Templates))
            (0, __1.error)("Error occured with model template, please try again");
        return new template_1.TemplateBuilder(designJSON["templateName"]);
    });
}
/**
 * Places images onto entry points on template
 * @param messageChain Chain of messages being sent
 * @param igdata Instagram user's data
 * @param siteName Name of template that site is being built onto
 * @param options SiteGEN options
 * @returns Image mapping between entry point and image source
 */
function placeImages(messageChain, images, profilePicture, siteName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, __1.log)("Describing images");
        const imgObjs = messagechain_1.MessageChain.ToImagesURL(images.slice(0, options.photoCount).map(x => x.source));
        const imgdesc = yield messageChain.describeImages(imgObjs, "Describe this image in a paragraph, including the color scheme, the main item present in this image, the overall feeling that this image presents, as well as where on a website that this image might make sense.", options.model);
        const imageDescriptions = imgdesc.map((x, i) => ({
            description: x,
            url: `image${i}.jpg`,
            caption: images[i].caption
        }));
        (0, __1.log)("Placing images on template");
        const imageFillPrompt = `I will give you a picture of the template that I will use to make this client's website, which displays a few spots to place images in, and what these spots are named. I will also give you a list of this client's instagram thumbnails and their caption. Firstly, decide what type of image should go into each image spot. Then, choose which images should go into which spots to make the best website for the client. Use the reasoning section to explain your reasoning behind where each image should go. If no image fits into the spot, return a description of what type of image would fit instead. Follow the rules exactly. <rules>\nDo not alter the url of any images at all. Respond in JSON adhering to the following format\n\`\`\`\nReasoning before you choose which images go where\n{ "IMAGE_A": string, , ... }\n\`\`\`\nYou are forbidden from adding any comments inside the JSON. Do not add any comments inside the JSON string. All reasoning should be done in the reasoning section. \n</rules>\n<example>IMAGE_A should be a attention grabbing header that ... while IMAGE_B should be a delicious meal that ...\n{ "IMAGE_A": "image3.jpg", "IMAGE_B": "picture of a palm tree in front of a beach", "IMAGE_C": "image2.jpg" }</example>\nHere are the images: ${JSON.stringify(imageDescriptions)}`;
        messageChain.addUserMessage(imageFillPrompt, messagechain_1.MessageChain.ToImageB64(`templates/${siteName}/showcase.png`));
        const fill = yield messageChain.queryModel(options.model);
        messageChain.addModelMessage(fill);
        // Match image placeholders with Instagram image
        const fillJSON = (0, utils_1.jsonParse)(fill);
        imageDescriptions.forEach((x, i) => x["source"] = imgObjs[i].image_url.url);
        const imageTags = {};
        for (const url in fillJSON) {
            const bestFit = fillJSON[url];
            const img = imageDescriptions.find(x => x["url"] == bestFit);
            if (img) {
                imageTags[url] = img["source"];
                continue;
            }
            // Use dalle-3 to make image that best fits
            (0, __1.log)("Prompting image generation");
            imageTags[url] = yield messageChain.promptImageGenerator(bestFit);
        }
        imageTags["IMAGE_Z"] = profilePicture;
        return imageTags;
    });
}
/**
 * Builds final version of site
 * @param messageChain Chain of messages sent so far
 * @param client String containing JSON information about client
 * @param template Template site is being built onto
 * @param options SiteGEN options
 */
function buildSite(messageChain, client, template, options) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, __1.log)("Visualizing website");
        // Reset messagechain 
        messageChain.resetChain();
        messageChain.addSystemMessage("You are a web designer altering a template for a client's Instagram page.");
        messageChain.addUserMessage(`This is the client that you are building the website for: \`${client}\``);
        messageChain.addUserMessage(`As web designers, we need to consider what the client wants in a website. Pretend that you are the client, and you are giving your input into what you want your website to look like. Include your desired styles, color palletes, and any text that you want in the site. Do not describe the layout of the site, just how you want the site to look.`);
        // Run asyncs in parallel since no overlap
        const [clientInput, sitePicBuffer] = yield Promise.all([
            // Imagine potential client input
            messageChain.queryModel(options.model),
            // Screenshot website template with entry points showing to give model insight
            template.build({ blankMode: true }).then(() => (0, scraper_1.photographSite)('build/index.html'))
        ]);
        (0, __1.log)("Building website");
        messageChain.popChain();
        const image = messagechain_1.MessageChain.ToImageB64(sitePicBuffer);
        const entryPoints = template.getEntryNameList();
        const prompt = `I will give you a picture of the website template that this client will be using, taken on an iPhone 12 Pro, along with the HTML and CSS code to the template. I will also give you a list of data entry points for you to write into to that will go into the website. This will be the finished product, so make sure that everything is filled out. You must follow the rules exactly. Here is the template:\n\`\`\`html\n${template.html}\n\`\`\`\n\`\`\`css\n${template.css}\n\`\`\`. Here are my entry points for you to fill out \n\`\`\`json\n${JSON.stringify(entryPoints)}\n\`\`\`\n<clientInput>${clientInput}</clientInput>\n<rules>Respond in JSON format as such: { [key: entry point name]: string to fill spot }. Ensure that for each entry point that I provided, you fill out and put inside the returned JSON. Do not make up any information or assume. If more information is needed to fill a specific area, generalize and make a broad statement.</rules> <example>{ ..., "HEADER": "<strong>Brand Name</strong> we are a company<br />that specializes in awesome", "PARAGRAPH_1": "Lorem ipsum dolor sit amet", ... }</example>`;
        messageChain.addUserMessage(prompt, image);
        const website = yield messageChain.queryModel(options.model, true);
        messageChain.addModelMessage(website);
        // Rewrite chain to hide image
        messageChain.popChain();
        messageChain.popChain();
        messageChain.addUserMessage(prompt);
        messageChain.addModelMessage(website);
        // Save HTML and build template
        const dataEntries = (0, utils_1.jsonParse)(website);
        template.setEntryPoints(new Map(Object.entries(dataEntries)));
        yield template.build();
    });
}
/*

    Below contains main functions utilizing functions above to modularize code and make simpler to read

*/
function ReviseBuild(messageChain, template, revisionMessage, options) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, __1.log)("Photographing site");
        // Revise build cycle
        const screenshot = messagechain_1.MessageChain.ToImageB64(yield (0, scraper_1.photographSite)('build/index.html'));
        if (!revisionMessage) {
            (0, __1.log)("Getting feedback");
            messageChain.addUserMessage("Pretend you are the client that this website was built for. Provide feedback about this site. Follow the rules exactly. <rules>The layout or images cannot be changed, so you are forbidden from commenting on those. Include feedback on if whether the text is effective, whether the tone is correct, and whether the information is correct. Include stylistic feedback as well, such as whether the color pallette was effective or whether the chosen font works with your business. Nitpick as much as you can. Ensure that the colors are effective for your brand, the different colors work well together, and that all text is visible and easily readable.</rules>", screenshot);
            revisionMessage = yield messageChain.queryModel(options.model);
            messageChain.popChain();
        }
        (0, __1.log)("Revising build");
        messageChain.addUserMessage(`I will send you the picture of the website that you designed as a screenshot on an iPhone 12, along with the client's feedback. Edit your entry points to make the client happy. To edit, resubmit the fields that you would like to change with the edited text. Follow the rules exactly.\n<rules>\nOnly include the entry points that you wish to alter. Do not create your own entry points. Ensure that all of the client's demands and wants are met. Respond in JSON following the following schema:\n\`\`\`json\n{ [key: entry point name]: "entry data goes in here" }\n\`\`\`\n</rules>\n<feedback>${revisionMessage}</feedback>`, screenshot);
        const changes = yield messageChain.queryModel(options.model, true);
        const dataEntriesRevise = (0, utils_1.jsonParse)(changes);
        template.setEntryPoints(new Map(Object.entries(dataEntriesRevise)));
        yield template.build();
        (0, __1.log)("Completed");
        return messageChain;
    });
}
exports.ReviseBuild = ReviseBuild;
function Build(handles, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageChain = new messagechain_1.MessageChain({ saveLog: true, logPath: 'log.txt' });
        // Scrape all sites
        const socialMediaData = {};
        const images = [];
        let profilePicture = '';
        yield Promise.all(Object.keys(handles).map((key) => __awaiter(this, void 0, void 0, function* () {
            const socialMedia = key;
            const data = yield ScraperMap[socialMedia](handles[socialMedia], options);
            socialMediaData[socialMedia] = data;
            images.push(...data.images);
            if (!profilePicture && "profilePicture" in data)
                profilePicture = data.profilePicture;
        })));
        const client = yield parseClient(messageChain, socialMediaData, images, options);
        const template = yield chooseTemplate(messageChain, options);
        template.setImages(yield placeImages(messageChain, images, profilePicture, template.templateName, options));
        yield buildSite(messageChain, client, template, options);
        if (options.autoRevise) {
            (0, __1.log)("Running auto revise cycle");
            yield ReviseBuild(messageChain, template, undefined, options);
        }
        return { messageChain, template };
    });
}
exports.Build = Build;
