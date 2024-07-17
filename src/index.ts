require('dotenv').config();
import { instagramScraper, photographSite } from './scraper';
import { jsonParse } from './utils';
import { MessageChain } from './messagechain';
import { TemplateBuilder, Templates } from './template';
import { log, error } from '..';

export async function Build(igHandle: string, photoCount: number) {
    const igdata = await instagramScraper(igHandle) as Record<string, any>;

    log("Instagram scraped, parsing data");
    const textPrompt = `I will give you the Instagram page for my client, @${igHandle}. Describe the purpose of this Instagram page, as well as the personality that this client might have, and the style and color scheme that would work best for them.\n<bio>${igdata.bio}</bio>\n<captions>\n${igdata.thumbnails.map((x: any) => x.alt).join('\n')}\n</captions>`;
    
    // Create list of images for model to parse
    const images = MessageChain.ToImagesURL(igdata.thumbnails.slice(0, photoCount).map((x: any) => x.src));

    // Array full of chronological messages sent between model and script
    const messageChain = new MessageChain({ saveLog: true, logPath: 'log.txt' });
    await messageChain.addUserMessage(textPrompt, ...images);

    // Get prefered design for website
    const siteDesign = await messageChain.queryModel();
    await messageChain.addModelMessage(siteDesign);

    // Share pictures of template to model and find best suited site
    log("Prefered design found, choosing template");
    const templateImages = MessageChain.ToImagesB64(Object.keys(Templates).map(x => `templates/${x}/${x}.png`), true);
    const templatePrompt = `I have ${Object.keys(Templates).length} website templates to choose from. Pick which website template would work the best with this Instagram page, and why you chose that specific template. Respond in JSON adhering to the following format <json>{ "templateName": ${Object.keys(Templates).map(x => `"${x}"`).join(" | ")}, "reasoning": string }</json>.`;
    await messageChain.addUserMessage(templatePrompt, ...templateImages);
    
    const design = await messageChain.queryModel();
    const designJSON = jsonParse(design);
    messageChain.chain.pop();

    // Get code for specific design
    const siteName = designJSON["templateName"];
    if(!(siteName in Templates)) error("Error occured with model template, please try again");
    const template = new TemplateBuilder(siteName);

    // Fill images inside website
    log("Template chosen, describing images");
    const imgdesc = await messageChain.describeImagesAsync(images, "Describe this image in a paragraph, including the color scheme, the main item present in this image, the overall feeling that this image presents, as well as where on a website that this image might make sense.");
    const imageDescriptions: Record<string, string>[] = imgdesc.map((x, i) => ({
        description: x,
        url: `image${i}.jpg`,
        caption: igdata.thumbnails[i].alt
    }));

    log("Images described, placing images");
    const imageFillPrompt = `I will give you a picture of the website template that would work best to match this client's needs. I will also give you a list of the client's instagram thumbnails and their caption. Firstly, decide what each image spot should include and what should go into that image slot. Use the reasoning section to explain your reasoning behind where each image should go. Then, choose which images should go into which spots to make the best website for the client. If no image fits into the spot, return a description of what type of image would fit instead. Follow the rules exactly. <rules>\nDo not alter the url of any images at all. Respond in JSON adhering to the following format\n\`\`\`\nReasoning before you choose which images go where\n{ "IMAGE_A": string, , ... }\n\`\`\`\n</rules>\n<example>IMAGE_A should be a attention grabbing header that ... while IMAGE_B should be a delicious meal that ...\n{ "IMAGE_A": "image3.jpg", "IMAGE_B": "picture of a palm tree in front of a beach", "IMAGE_C": "image2.jpg" }</example>\nHere are the images: ${JSON.stringify(imageDescriptions)}`;
    await messageChain.addUserMessage(imageFillPrompt, MessageChain.ToImageB64(`templates/${siteName}/showcase.png`));
    const fill = await messageChain.queryModel();
    await messageChain.addModelMessage(fill);

    const fillJSON = jsonParse(fill);
    imageDescriptions.forEach((x, i) => x["source"] = images[i].image_url.url);

    const imageTags: { [key: string]: string } = {};
    for(const url in fillJSON) {
        const bestFit = fillJSON[url];
        const img = imageDescriptions.find(x => x["url"] == bestFit);
        if(img) {
            imageTags[url] = img["source"];
            continue;
        }

        // use dalle 3 to make image
        log("Prompting image generation");
        imageTags[url] = await messageChain.promptImageGenerator(bestFit);
    }

    imageTags["IMAGE_Z"] = igdata.profilePicture;
    template.setImages(imageTags);

    // Share HTML code and ask to change template to fit best
    log("Images placed, building website");
    const entryPoints = template.getEntryNameList();
    const websitePrompt = `I will give you the HTML and CSS code to the website template. I will also give you a list of data entry points for you to write into to make the best possible website for the client. This will be the finished product so make sure that everything is filled out. You must follow the rules exactly. Here is the template:\n\`\`\`html\n${template.html}\n\`\`\`\n\`\`\`css\n${template.css}\n\`\`\`. Here are my entry points for you to fill out \`${JSON.stringify(entryPoints)}\` <rules>Respond in JSON format as such: { [key: entry point name]: string to fill spot }. Ensure that for each entry point that I provided, you fill out and put inside the returned JSON. Do not make up any information or assume. If more information is needed to fill a specific area, generalize and make a broad statement.</rules> <example>{ ..., "HEADER": "<strong>Brand Name</strong> we are a company<br />that specializes in awesome", "PARAGRAPH_1": "Lorem ipsum dolor sit amet", ... }</example>`;
    await messageChain.addUserMessage(websitePrompt);
    const website = await messageChain.queryModel();
    await messageChain.addModelMessage(website);

    // Save HTML and build template
    const dataEntries = jsonParse(website);
    template.setEntryPoints(new Map(Object.entries(dataEntries)));
    await template.build();
    log("Website built, revising website");

    // Revise build cycle
    const sitePicBuffer = await photographSite('build/index.html');
    if(sitePicBuffer instanceof Error) {
        log("Revision failed, website completed");
        return;
    }

    const reviseChain = new MessageChain({ logPath: 'reviselog.txt', saveLog: true });
    await reviseChain.addSystemMessage("You are a web designer altering a template for a client's Instagram page.");
    reviseChain.chain.push(...messageChain.chain.slice(-2));

    await reviseChain.addUserMessage("I will send you the picture of the website that you designed as a screenshot on an iPhone 12. Review it and think about what areas, styles, or words could be fixed up or changed. If there is any aspect that you would like to edit, resubmit the fields that you would like to change with the edited text. Only include the entry points that you wish to alter. If you do not wish to alter anything, return an empty JSON string. Once you review this site, it will be the final version that gets sent to the client, so ensure that everything is to standard. Respond in JSON following the following schema:\n```json\n{ [key: entry point name]: string to fill spot }\n```", MessageChain.ToImageB64(sitePicBuffer));
    const changes = await reviseChain.queryModel();
    const dataEntriesRevise = jsonParse(changes);
    template.setEntryPoints(new Map(Object.entries(dataEntriesRevise)));
    await template.build();
    log("Website revised");
}