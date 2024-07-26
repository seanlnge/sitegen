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
exports.TemplateBuilder = exports.Templates = void 0;
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("./utils");
const __1 = require("..");
exports.Templates = {
    "directive": JSON.parse(fs.readFileSync("templates/directive/sitegen.json").toString()),
    "strata": JSON.parse(fs.readFileSync("templates/strata/sitegen.json").toString()),
    "dimension": JSON.parse(fs.readFileSync("templates/dimension/sitegen.json").toString()),
    "spectral": JSON.parse(fs.readFileSync("templates/spectral/sitegen.json").toString()),
    "big-picture": JSON.parse(fs.readFileSync("templates/big-picture/sitegen.json").toString()),
};
class TemplateBuilder {
    constructor(template) {
        this.templateName = template;
        this.html = fs.readFileSync(`templates/${template}/index.html`).toString();
        this.css = fs.readFileSync(`templates/${template}/assets/css/main.css`).toString();
        this.imageDownloads = new Map();
        this.entryPoints = new Map();
        this.entryPoints.set("POTENTIAL_EXTRA_CSS", "");
        // Populate this.entryPoints with all entry names found in HTML and CSS
        let index = 0;
        while (this.html.slice(index).indexOf("$") !== -1) {
            const start = index + this.html.slice(index).indexOf("$") + 1;
            const end = start + this.html.slice(start).indexOf("$");
            this.entryPoints.set(this.html.slice(start, end), "");
            index = end + 1;
        }
        index = 0;
        while (this.css.slice(index).indexOf("$") !== -1) {
            const start = index + this.css.slice(index).indexOf("$") + 1;
            const end = start + this.css.slice(start).indexOf("$");
            this.entryPoints.set(this.css.slice(start, end), "");
            index = end + 1;
        }
    }
    setImages(images) {
        for (const image in images) {
            this.imageDownloads.set(image, images[image]);
            const extension = images[image].split('?')[0].split('.').slice(-1)[0];
            this.entryPoints.set(`${image}_SRC`, `images/${image}.${extension}`);
        }
    }
    getEntryNameList() {
        const b = Array.from(this.entryPoints.keys());
        return b.filter(x => !/IMAGE_._SRC/.test(x));
    }
    setEntryPoints(entries) {
        for (const entry of entries.keys()) {
            this.entryPoints.set(entry, entries.get(entry));
        }
    }
    build(buildOptions = {
        blankMode: false,
        buildFolder: 'build/'
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            let html = `<DOCTYPE! html>\n<html>\n${(0, utils_1.xmlParse)(this.html, "html")}\n</html>`;
            let css = this.css.split('*/').slice(1).join('*/');
            // Delete old build folder if existent
            if (fs.existsSync("build"))
                yield fs.promises.rm("build", { force: true, recursive: true });
            // Make folder structure
            yield fs.promises.mkdir("build");
            yield fs.promises.mkdir("build/images");
            yield fs.promises.mkdir("build/assets");
            yield fs.promises.mkdir("build/assets/webfonts");
            yield fs.promises.mkdir("build/assets/css");
            yield fs.promises.mkdir("build/assets/css/images");
            yield fs.promises.mkdir("build/assets/js");
            // Add all global files found in all templates
            yield fs.promises.cp("templates/global/webfonts", "build/assets/webfonts", { recursive: true });
            yield fs.promises.cp("templates/global/css", "build/assets/css", { recursive: true });
            yield fs.promises.cp("templates/global/js", "build/assets/js", { recursive: true });
            // Move all files specific to the template
            for (const FILE of exports.Templates[this.templateName].structure) {
                yield fs.promises.copyFile(`templates/${this.templateName}/${FILE}`, `build/${FILE}`);
            }
            // Add images to build/images folder
            for (const [imageName, source] of this.imageDownloads.entries()) {
                const extension = source.split('?')[0].split('.').slice(-1)[0];
                const imgData = yield (0, node_fetch_1.default)(source).catch(() => {
                    return (0, __1.error)("Error downloading image, continuing build", false);
                });
                if (imgData instanceof Error)
                    continue;
                yield fs.promises.writeFile(`build/images/${imageName}.${extension}`, yield imgData.buffer());
            }
            // Alter HTML and CSS to include data entry
            for (const [entryName, entry] of this.entryPoints.entries()) {
                if (buildOptions.blankMode && entryName.slice(-4) != "_SRC")
                    continue;
                while (html.indexOf(`$${entryName}$`) !== -1)
                    html = html.replace(`$${entryName}$`, entry);
                while (css.indexOf(`$${entryName}$`) !== -1)
                    css = css.replace(`$${entryName}$`, entry);
            }
            css += "\n" + this.entryPoints.get("POTENTIAL_EXTRA_CSS");
            // Use default root
            if (buildOptions.blankMode) {
                const startRootIndex = css.indexOf(":root");
                const endRootIndex = startRootIndex + css.slice(startRootIndex).indexOf("}");
                css = css.slice(0, startRootIndex) + exports.Templates[this.templateName].defaultRoot + css.slice(endRootIndex);
            }
            // Finalize build
            yield fs.promises.writeFile("build/index.html", html);
            yield fs.promises.writeFile("build/assets/css/main.css", css);
        });
    }
}
exports.TemplateBuilder = TemplateBuilder;
