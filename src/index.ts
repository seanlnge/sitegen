require('dotenv').config();
import { instagramScraper } from './scraper';
import { jsonParse } from './utils';
import { MessageChain } from './messagechain';
import { TemplateBuilder } from './template';

const start = Date.now();
const log = (text: string) => console.log("\x1b[92m" + (Date.now() - start) + "ms \x1b[0m" + "- " + text);

export async function Build(igHandle: string) {
    const igdata = await instagramScraper(igHandle) as Record<string, any>;
    //fs.writeFile("igdata.json", JSON.stringify(igdata), () => {});
    //const igdata = JSON.parse(fs.readFileSync("igdata.json").toString());

    log("Instagram scraped, choosing template");
    const textPrompt = `I will give you the Instagram page for @${igHandle}. Pretend you are this user. Describe the purpose of your Instagram page, as well as what you would display if you were to turn it into a static single page website. <bio>${igdata.bio}</bio>`;
    
    // Create list of images for model to parse
    const images = MessageChain.ToImagesURL(igdata.thumbnails.slice(0, 10).map((x: any) => x.src));

    // Array full of chronological messages sent between model and script
    const messageChain = new MessageChain({ saveLog: true, logPath: 'log.txt' });
    await messageChain.addUserMessage(textPrompt, ...images);

    // Get prefered design for website
    const siteDesign = await messageChain.queryModel();
    await messageChain.addModelMessage(siteDesign);

    // Share pictures of template to model and find best suited site
    log("Prefered design found, choosing template");
    const templateImages = MessageChain.ToImagesB64(['templates/directive/directive.png', 'templates/strata/strata.png', 'templates/dimension/dimension.png', 'templates/spectral/spectral.png']);
    const templatePrompt = `I have 3 website templates to choose from, Directive, Strata, Dimension, and Spectral. Pick which website template would work the best with this client. Respond in JSON adhering to the following format <json>{ "templateName": "directive" | "strata" | "dimension" | "spectral" }</json>`;
    await messageChain.addUserMessage(templatePrompt, ...templateImages);
    
    const design = await messageChain.queryModel();
    const designJSON = jsonParse(design);
    messageChain.chain.pop(); // we dont need that guy anymore

    // Get code for specific design
    const siteName = designJSON["templateName"];
    if(siteName != "directive" && siteName != "strata" && siteName != "dimension" && siteName != "spectral") throw new Error("broooo mf made up its own template");
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
    const imageFillPrompt = `I will give you a picture of the website template that would work best to match this client's needs. I will also give you a list of the client's instagram thumbnails and their caption. Choose which images should go into which spots to make the best website for the client. If no image fits into the spot, return a description of what type of image would fit instead. Follow the rules exactly. <rules>Do not alter the url of any images at all. Respond in JSON adhering to the following format { "IMAGE_A": string, , ... }</rules>\n<example>{ "IMAGE_A": "image3.jpg", "IMAGE_B": "picture of a palm tree in front of a beach", "IMAGE_C": "image2.jpg" }</example>\nHere are the images: ${JSON.stringify(imageDescriptions)}`;
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

    // Svae HTML and build template
    const dataEntries = jsonParse(website);
    template.setEntryPoints(new Map(Object.entries(dataEntries)));
    await template.build();
    log("Website built");
}