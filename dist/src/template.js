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
exports.TemplateBuilder = void 0;
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
class TemplateBuilder {
    constructor(template) {
        this.templateName = template;
        this.html = fs.readFileSync(`templates/${template}/index.html`).toString();
        this.css = fs.readFileSync(`templates/${template}/assets/css/main.css`).toString();
        this.imageMapping = new Map();
    }
    setHTML(html) {
        this.html = html;
    }
    setImages(images) {
        for (const image in images) {
            this.imageMapping.set(image.toLowerCase(), images[image]);
        }
    }
    build() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
            yield fs.promises.mkdir("build/assets/sass");
            yield fs.promises.mkdir("build/assets/sass/libs");
            // Add all global files found in all templates
            yield fs.promises.cp("templates/global/webfonts", "build/assets/webfonts", { recursive: true });
            yield fs.promises.cp("templates/global/css", "build/assets/css", { recursive: true });
            yield fs.promises.cp("templates/global/js", "build/assets/js", { recursive: true });
            yield fs.promises.cp("templates/global/sass/libs", "build/assets/sass/libs", { recursive: true });
            // Move all files specific to the template
            const TEMPLATE_MAP = {
                "directive": TemplateBuilder.DIRECTIVE_COPYFILE_STRUCTURE,
                "strata": TemplateBuilder.STRATA_COPYFILE_STRUCTURE
            };
            for (const FILE of TEMPLATE_MAP[this.templateName]) {
                yield fs.promises.copyFile(`templates/${this.templateName}/${FILE}`, `build/${FILE}`);
            }
            // Add images to build/images folder and alter img tags in HTML
            let index = (_a = /<img src="/.exec(this.html)) === null || _a === void 0 ? void 0 : _a.index;
            console.log(this.imageMapping, this.html);
            while (index) {
                // Parentheses are index+10 and index+17: <img src="(I)MAGE_B(") alt=...
                const htmlSrc = this.html.slice(index + 10, index + 17).toLowerCase();
                const image = this.imageMapping.get(htmlSrc);
                console.log(htmlSrc, image);
                if (!image) {
                    index++;
                    continue;
                }
                console.log(image);
                const imgData = yield (0, axios_1.default)({
                    method: "GET",
                    url: image.source,
                    responseType: "stream"
                });
                yield imgData.data.pipe(fs.createWriteStream(`build/images/html${index}.jpg`));
                const end = index + this.html.slice(index).indexOf(">") + 1;
                const startStr = `${this.html.slice(0, index)}<img src="images/html${index}.jpg" alt="${image.alt}" />`;
                const endStr = this.html.slice(end);
                if (/<img src="/.test(endStr))
                    index = startStr.length + /<img src="/.exec(endStr).index;
                else
                    index = undefined;
                this.html = startStr + endStr;
            }
            // Add images to build/images folder and alter url in CSS
            let cssIndex = (_b = /url\("IMAGE_/.exec(this.css)) === null || _b === void 0 ? void 0 : _b.index;
            while (cssIndex) {
                // Parentheses are cssIndex+5 and cssIndex+12: url("IMAGE_A")
                const cssSrc = this.css.slice(cssIndex + 5, cssIndex + 12).toLowerCase();
                const image = this.imageMapping.get(cssSrc);
                if (!image) {
                    cssIndex++;
                    continue;
                }
                const imgData = yield (0, axios_1.default)({
                    method: "GET",
                    url: image.source,
                    responseType: "stream"
                });
                yield imgData.data.pipe(fs.createWriteStream(`build/images/css${cssIndex}.jpg`));
                const end = cssIndex + this.css.slice(cssIndex).indexOf(")") + 1;
                const startStr = `${this.css.slice(0, cssIndex)}url("../../images/css${cssIndex}.jpg")`;
                const endStr = this.css.slice(end);
                if (/url\("IMAGE_/.test(endStr))
                    cssIndex = startStr.length + /url\("IMAGE_/.exec(endStr).index;
                else
                    cssIndex = undefined;
                this.css = startStr + endStr;
            }
            // Finalize build
            yield fs.promises.writeFile("build/index.html", this.html);
            yield fs.promises.writeFile("build/assets/css/main.css", this.css);
        });
    }
}
exports.TemplateBuilder = TemplateBuilder;
TemplateBuilder.DIRECTIVE_COPYFILE_STRUCTURE = [
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
TemplateBuilder.STRATA_COPYFILE_STRUCTURE = [
    "assets/js/main.js",
    "assets/js/util.js",
    "assets/sass/main.scss",
    "assets/css/images/overlay.png"
];
