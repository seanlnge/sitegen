require('dotenv').config();
import { instagramScraper } from './scraper';
import * as fs from 'fs';
import { jsonParse, xmlParse } from './utils';
import { MessageChain } from './messagechain';
import { TemplateBuilder, TemplateImage } from './template';

const start = Date.now();
const log = (text: string) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);

export async function Build(igHandle: string) {
    //const igdata = await instagramScraper(igHandle) as Record<string, any>;
    //fs.writeFile("igdata.json", JSON.stringify(igdata), () => {});
    const igdata = JSON.parse(fs.readFileSync("igdata.json").toString());
    log("Instagram scraped, choosing template");

    const textPrompt = `I will give you the Instagram page for @${igHandle}. Pretend you are this user and you are wanting a simple landing page for your Instagram profile. This website will exclusively be a static single page landing website to showcase the client's content. Explain what you would like in such a website, such as the theme, the style, and what information to put into the site. <bio>${igdata.bio}</bio>`;
    
    // Create list of images for model to parse
    const images = MessageChain.ToImagesURL([igdata.profilePicture, ...igdata.thumbnails.slice(0, 7)]);

    // Array full of chronological messages sent between model and script
    const messageChain = new MessageChain({ saveLog: true, logPath: 'log.txt' });
    await messageChain.addUserMessage(textPrompt, ...images);

    // Get prefered design for website
    const siteDesign = await messageChain.queryModel();
    await messageChain.addModelMessage(siteDesign);
    log("Prefered design found, choosing template");

    // Share pictures of template to model and find best suited site
    const templateImages = MessageChain.ToImagesB64(['templates/directive/directive.png', 'templates/strata/strata.png']);
    const templatePrompt = `I have 2 website templates to choose from, Directive, and Strata. Pick which website template would work the best with this client. Respond in JSON adhering to the following format <json>{ "templateName": "directive" | "strata" }</json>`;
    await messageChain.addUserMessage(templatePrompt, ...templateImages);
    
    const design = await messageChain.queryModel();
    const designJSON = jsonParse(design);
    messageChain.chain.pop(); // we dont need that guy anymore
    log("Template chosen, describing images")

    // Get code for specific design
    const siteName = designJSON["templateName"];
    if(siteName != "directive" && siteName != "strata") throw new Error("broooo mf made up its own template");
    const template = new TemplateBuilder(siteName);

    // Fill images inside website
    const imageDescriptions = await messageChain.describeImagesAsync(images.slice(1), "Describe this image in a paragraph, including the color scheme, the main item present in this image, and the overall feeling that this image presents.");
    const imageMap: Record<string, string> = {};
    imageDescriptions.forEach((imageDesc, index) => imageMap["image" + index] = imageDesc);
    log("Images described, placing images")

    const imageFillPrompt = `I will give you a picture of the website template that would work best to match this client's needs. I will also give you a list of images and their respective descriptions. Choose which images should go into which spots to make the best website for the client. Also write a short alt text describing the image. Respond in JSON adhering to the following format <json>{ "IMAGE_A": { "title": "string representing which image goes in IMAGE_A", "alt": "short alt text summarizing description" }, "IMAGE_B": ... }</json>. Here are the images: <json>${imageMap}</json>`;
    await messageChain.addUserMessage(imageFillPrompt, MessageChain.ToImageB64(`templates/${siteName}/showcase.png`));
    const fill = await messageChain.queryModel();
    await messageChain.addModelMessage(fill);
    log("Images placed, building website");

    const fillJSON = jsonParse(fill);

    const imageTags: { [key: string]: TemplateImage } = {};
    for(let i=0; i<Object.keys(fillJSON).length; i++) {
        const image = Object.keys(fillJSON)[i];

        imageTags[image] = {
            source: images.slice(1)[i].image_url.url,
            alt: fillJSON[image].alt,
        }
    }
    template.setImages(imageTags);

    // Share HTML code and ask to change template to fit best
    const websitePrompt = `I will give you the HTML code to the website template. Alter this template's text to make the best possible website for the client. This will be the finished product so make sure that everything is filled out. You must follow the rules exactly. Here is the template: <HTMLCode>${template.html}</HTMLCode> <rules>Do not alter any image tags. Do not change the src of an image tag. Respond in XML format as such: <HTMLCode></HTMLCode>. Do not leave any of the filler, lorem ipsum, text.</rules>`;
    await messageChain.addUserMessage(websitePrompt);
    const website = await messageChain.queryModel();

    // Svae HTML and build template
    const adjustedHTML = xmlParse(website, "HTMLCode");
    if(adjustedHTML == null) throw new Error("mf forgot to write HTML");
    template.setHTML(adjustedHTML);
    await template.build();
    log("Website built");
}