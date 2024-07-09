import * as fs from "fs";
import axios from 'axios';

export type TemplateName = "directive" | "strata";

export type TemplateImage = {
    source: string;
    alt: string;
}

export class TemplateBuilder {
    templateName: TemplateName;
    html: string;
    css: string;
    imageMapping: Map<string, TemplateImage>;

    constructor(template: TemplateName) {
        this.templateName = template;
        this.html = fs.readFileSync(`templates/${template}/index.html`).toString();
        this.css = fs.readFileSync(`templates/${template}/assets/css/main.css`).toString();
        this.imageMapping = new Map<string, TemplateImage>();
    }

    setHTML(html: string) {
        this.html = html;
    }

    setImages(images: { [key: string]: TemplateImage }) {
        for(const image in images) {
            this.imageMapping.set(image.toLowerCase(), images[image]);
        }
    }

    async build() {
        // Delete old build folder if existent
        if(fs.existsSync("build")) await fs.promises.rm("build", { force: true, recursive: true });

        // Make folder structure
        await fs.promises.mkdir("build");
        await fs.promises.mkdir("build/images");
        await fs.promises.mkdir("build/assets");
        await fs.promises.mkdir("build/assets/webfonts");
        await fs.promises.mkdir("build/assets/css");
        await fs.promises.mkdir("build/assets/css/images");
        await fs.promises.mkdir("build/assets/js");
        await fs.promises.mkdir("build/assets/sass");
        await fs.promises.mkdir("build/assets/sass/libs");

        // Add all global files found in all templates
        await fs.promises.cp("templates/global/webfonts", "build/assets/webfonts", { recursive: true });
        await fs.promises.cp("templates/global/css", "build/assets/css", { recursive: true });
        await fs.promises.cp("templates/global/js", "build/assets/js", { recursive: true });
        await fs.promises.cp("templates/global/sass/libs", "build/assets/sass/libs", { recursive: true });

        // Move all files specific to the template
        const TEMPLATE_MAP = {
            "directive": TemplateBuilder.DIRECTIVE_COPYFILE_STRUCTURE,
            "strata": TemplateBuilder.STRATA_COPYFILE_STRUCTURE
        }
        for(const FILE of TEMPLATE_MAP[this.templateName]) {
            await fs.promises.copyFile(
                `templates/${this.templateName}/${FILE}`,
                `build/${FILE}`
            );
        }

        // Add images to build/images folder and alter img tags in HTML
        let index = /<img src="/.exec(this.html)?.index;
        console.log(this.imageMapping, this.html);
        while(index) {
            // Parentheses are index+10 and index+17: <img src="(I)MAGE_B(") alt=...
            const htmlSrc = this.html.slice(index!+10, index!+17).toLowerCase();
            const image = this.imageMapping.get(htmlSrc);
            console.log(htmlSrc, image);
            if(!image) {
                index++;
                continue;
            }
            console.log(image);

            const imgData = await axios({
                method: "GET",
                url: image.source,
                responseType: "stream"
            });
            await imgData.data.pipe(fs.createWriteStream(`build/images/html${index}.jpg`));

            const end = index! + this.html.slice(index).indexOf(">") + 1;
            const startStr = `${this.html.slice(0, index)}<img src="images/html${index}.jpg" alt="${image.alt}" />`;
            const endStr = this.html.slice(end);

            if(/<img src="/.test(endStr)) index = startStr.length + /<img src="/.exec(endStr)!.index;
            else index = undefined;

            this.html = startStr + endStr;
        }

        // Add images to build/images folder and alter url in CSS
        let cssIndex = /url\("IMAGE_/.exec(this.css)?.index;
        while(cssIndex) {
            // Parentheses are cssIndex+5 and cssIndex+12: url("IMAGE_A")
            const cssSrc = this.css.slice(cssIndex!+5, cssIndex!+12).toLowerCase();
            const image = this.imageMapping.get(cssSrc);
            if(!image) {
                cssIndex++;
                continue;
            }

            const imgData = await axios({
                method: "GET",
                url: image.source,
                responseType: "stream"
            });
            await imgData.data.pipe(fs.createWriteStream(`build/images/css${cssIndex}.jpg`));

            const end = cssIndex! + this.css.slice(cssIndex).indexOf(")") + 1;
            const startStr = `${this.css.slice(0, cssIndex)}url("../../images/css${cssIndex}.jpg")`;
            const endStr = this.css.slice(end);
            
            if(/url\("IMAGE_/.test(endStr)) cssIndex = startStr.length + /url\("IMAGE_/.exec(endStr)!.index;
            else cssIndex = undefined;

            this.css = startStr + endStr;
        }

        // Finalize build
        await fs.promises.writeFile("build/index.html", this.html);
        await fs.promises.writeFile("build/assets/css/main.css", this.css);
    }

    static DIRECTIVE_COPYFILE_STRUCTURE = [
        "assets/css/images/bottom-1280.svg",
        "assets/css/images/bottom-1600.svg",
        "assets/css/images/bottom-3200.svg",
        "assets/css/images/overlay.png",
        "assets/css/images/top-1280.svg",
        "assets/css/images/top-1600.svg",
        "assets/css/images/top-3200.svg",
        "assets/js/main.js",
        "assets/js/util.js",
        "assets/sass/main.scss",
    ];
    static STRATA_COPYFILE_STRUCTURE = [
        "assets/js/main.js",
        "assets/js/util.js",
        "assets/sass/main.scss",
        "assets/css/images/overlay.png"
    ];
}