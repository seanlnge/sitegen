import * as fs from "fs";
import fetch from "node-fetch";
import { xmlParse } from "./utils";
import { error } from "..";

export const Templates: Record<string, { structure: string[], defaultRoot: string }> = {
    "directive": JSON.parse(fs.readFileSync("templates/directive/sitegen.json").toString()),
    "strata": JSON.parse(fs.readFileSync("templates/strata/sitegen.json").toString()),
    "dimension": JSON.parse(fs.readFileSync("templates/dimension/sitegen.json").toString()),
    "spectral": JSON.parse(fs.readFileSync("templates/spectral/sitegen.json").toString()),
    "big-picture": JSON.parse(fs.readFileSync("templates/big-picture/sitegen.json").toString()),
}

export type TemplateImage = {
    source: string;
    alt: string;
}

type BuildOptionsStrict = {
    blankMode: boolean,
    buildFolder: string
}

export type BuildOptions = {
    [K in keyof BuildOptionsStrict]?: BuildOptionsStrict[K]
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

        this.entryPoints.set("POTENTIAL_EXTRA_CSS", "");

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
            const extension = images[image].split('?')[0].split('.').slice(-1)[0];
            this.entryPoints.set(`${image}_SRC`, `images/${image}.${extension}`);
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

    async build(buildOptions: BuildOptions = {
        blankMode: false,
        buildFolder: 'build/'
    }) {
        let html = `<DOCTYPE! html>\n<html>\n${xmlParse(this.html, "html")}\n</html>`;
        let css = this.css.split('*/').slice(1).join('*/');

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
        for(const FILE of Templates[this.templateName].structure) {
            await fs.promises.copyFile(
                `templates/${this.templateName}/${FILE}`,
                `build/${FILE}`
            );
        }

        // Add images to build/images folder
        for(const [imageName, source] of this.imageDownloads.entries()) {
            const extension = source.split('?')[0].split('.').slice(-1)[0];
            const imgData = await fetch(source).catch(() => {
                return error("Error downloading image, continuing build", false)
            });
            if(imgData instanceof Error) continue;
            await fs.promises.writeFile(`build/images/${imageName}.${extension}`, await imgData.buffer());
        }

        // Alter HTML and CSS to include data entry
        for(const [entryName, entry] of this.entryPoints.entries()) {
            if(buildOptions.blankMode && entryName.slice(-4) != "_SRC") continue;
            while(html.indexOf(`$${entryName}$`) !== -1) html = html.replace(`$${entryName}$`, entry);
            while(css.indexOf(`$${entryName}$`) !== -1) css = css.replace(`$${entryName}$`, entry);
        }
        css += "\n" + this.entryPoints.get("POTENTIAL_EXTRA_CSS");

        // Use default root
        if(buildOptions.blankMode) {
            const startRootIndex = css.indexOf(":root");
            const endRootIndex = startRootIndex + css.slice(startRootIndex).indexOf("}");

            css = css.slice(0, startRootIndex) + Templates[this.templateName].defaultRoot + css.slice(endRootIndex);
        }

        // Finalize build
        await fs.promises.writeFile("build/index.html", html);
        await fs.promises.writeFile("build/assets/css/main.css", css);
    }
}