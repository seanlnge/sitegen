import * as fs from "fs";
import axios from 'axios';
import { xmlParse } from "./utils";
import { error } from "..";

const DIRECTIVE_COPYFILE_STRUCTURE = [
    "assets/css/images/bottom-1280.svg",
    "assets/css/images/bottom-1600.svg",
    "assets/css/images/bottom-3200.svg",
    "assets/css/images/overlay.png",
    "assets/css/images/top-1280.svg",
    "assets/css/images/top-1600.svg",
    "assets/css/images/top-3200.svg",
    "assets/js/main.js",
    "assets/js/util.js",
];
const STRATA_COPYFILE_STRUCTURE = [
    "assets/js/main.js",
    "assets/js/util.js",
    "assets/css/images/overlay.png"
];
const DIMENSION_COPYFILE_STRUCTURE = [
    "assets/js/main.js",
    "assets/js/util.js",
    "images/overlay.png",
];
const SPECTRAL_COPYFILE_STRUCTURE = [
    "assets/css/images/arrow.svg",
    "assets/css/images/bars.svg",
    "assets/css/images/close.svg",
    "assets/js/main.js",
    "assets/js/util.js",
    "assets/js/jquery.scrollex.min.js",
    "assets/js/jquery.scrolly.min.js"  
];
const BIGPICTURE_COPYFILE_STRUCTURE = [
    "assets/css/images/arrow.svg",
    "assets/css/images/dark-arrow.svg",
    "assets/css/images/overlay.png",
    "assets/css/images/poptrox-closer.svg",
    "assets/css/images/poptrox-nav.svg",
    "assets/js/main.js",
    "assets/js/util.js",
    "assets/js/jquery.scrolly.min.js",
    "assets/js/jquery.scrollex.min.js",
];

export const Templates = {
    "directive": DIRECTIVE_COPYFILE_STRUCTURE,
    "strata": STRATA_COPYFILE_STRUCTURE,
    "dimension": DIMENSION_COPYFILE_STRUCTURE,
    "spectral": SPECTRAL_COPYFILE_STRUCTURE,
    "bigpicture": BIGPICTURE_COPYFILE_STRUCTURE,
}

export type TemplateImage = {
    source: string;
    alt: string;
}

export class TemplateBuilder {
    templateName: keyof typeof Templates;
    html: string;
    css: string;
    imageDownloads: Map<string, string>;
    entryPoints: Map<string, string>;

    constructor(template: keyof typeof Templates) {
        this.templateName = template;
        this.html = fs.readFileSync(`templates/${template}/index.html`).toString();
        this.css = fs.readFileSync(`templates/${template}/assets/css/main.css`).toString();

        this.imageDownloads = new Map<string, string>();
        this.entryPoints = new Map<string, string>();

        // Populate this.entryPoints with all entry names found in HTML and CSS
        let index = 0;
        while(this.html.slice(index).indexOf("$") !== -1) {
            const start = index + this.html.slice(index).indexOf("$") + 1;
            const end = start + this.html.slice(start).indexOf("$");

            this.entryPoints.set(this.html.slice(start, end), "");
            index = end + 1;
        }

        index = 0;
        while(this.css.slice(index).indexOf("$") !== -1) {
            const start = index + this.css.slice(index).indexOf("$") + 1;
            const end = start + this.css.slice(start).indexOf("$");

            this.entryPoints.set(this.css.slice(start, end), "");
            index = end + 1;
        }
    }

    setImages(images: { [key: string]: string }) {
        for(const image in images) {
            this.imageDownloads.set(image, images[image]);
            this.entryPoints.set(`${image}_SRC`, `images/${image}.jpg`);
        }
    }

    getEntryNameList() {
        const b = Array.from(this.entryPoints.keys());
        return b.filter(x => !/IMAGE_._SRC/.test(x));
    }

    setEntryPoints(entries: Map<string, string>) {
        for(const entry of entries.keys()) {
            this.entryPoints.set(entry, entries.get(entry)!);
        }
    }

    async build() {
        let html = `<DOCTYPE! html>\n<html>\n${xmlParse(this.html, "html")}\n</html>`;
        let css = this.css.split('*/')[1];

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

        // Add all global files found in all templates
        await fs.promises.cp("templates/global/webfonts", "build/assets/webfonts", { recursive: true });
        await fs.promises.cp("templates/global/css", "build/assets/css", { recursive: true });
        await fs.promises.cp("templates/global/js", "build/assets/js", { recursive: true });

        // Move all files specific to the template
        for(const FILE of Templates[this.templateName]) {
            await fs.promises.copyFile(
                `templates/${this.templateName}/${FILE}`,
                `build/${FILE}`
            );
        }

        // Add images to build/images folder
        for(const [imageName, source] of this.imageDownloads.entries()) {
            const imgData = await axios({
                method: "GET",
                url: source,
                responseType: "stream"
            }).catch(() => {
                this.imageDownloads.delete(imageName);
                return error("Error downloading image, continuing build", false)
            });
            if(imgData instanceof Error) continue;
            await imgData.data.pipe(fs.createWriteStream(`build/images/${imageName}.jpg`));
        }

        // Alter HTML and CSS to include data entry
        for(const [entryName, entry] of this.entryPoints.entries()) {
            while(html.indexOf(`$${entryName}$`) !== -1) html = html.replace(`$${entryName}$`, entry);
            while(css.indexOf(`$${entryName}$`) !== -1) css = css.replace(`$${entryName}$`, entry);
        }

        // Finalize build
        await fs.promises.writeFile("build/index.html", html);
        await fs.promises.writeFile("build/assets/css/main.css", css);
    }
}