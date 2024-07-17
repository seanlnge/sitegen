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
exports.photographSite = exports.instagramScraper = void 0;
const puppeteer_1 = __importStar(require("puppeteer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const __1 = require("..");
require('dotenv').config();
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
/**
 * Scrapes instagram
 * @returns string[]
 */
function instagramScraper(handle) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch({ headless: true });
        const page = (yield browser.pages())[0];
        (0, __1.log)('Opening instagram.com');
        yield page.goto("https://www.instagram.com", { waitUntil: 'networkidle2' });
        (0, __1.log)('Logging into account');
        yield page.click('#loginForm input[name="username"]');
        yield page.keyboard.type(process.env['INSTA_USER'], { delay: 50 });
        yield page.click('#loginForm input[name="password"]');
        yield page.keyboard.type(process.env['INSTA_PASS'], { delay: 50 });
        yield page.click('#loginForm button[type="submit"]');
        (0, __1.log)('Loading and scraping page for @' + handle);
        yield page.goto('https://www.instagram.com/' + handle, { waitUntil: 'networkidle0' });
        const igdata = yield page.evaluate(() => {
            var _a, _b;
            const images = Array.from(document.querySelectorAll('img'));
            const ppurl = (_a = document.querySelector('header > section > div > div > a > img')) === null || _a === void 0 ? void 0 : _a.src;
            const thumbnails = images.filter(x => x.classList.length == 6).map(x => ({ alt: x.alt, src: x.src }));
            const bioElement = document.querySelector('section > div > span > div > span');
            return {
                profilePicture: ppurl,
                bio: bioElement ? (_b = bioElement.textContent) !== null && _b !== void 0 ? _b : "" : "",
                thumbnails,
            };
        });
        yield browser.close();
        return igdata;
    });
}
exports.instagramScraper = instagramScraper;
;
function photographSite(siteUrl) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch({ headless: true, defaultViewport: null });
        const page = (yield browser.pages())[0];
        yield page.emulate(puppeteer_1.KnownDevices['iPhone 12 Pro']);
        yield page.goto(path_1.default.resolve(siteUrl));
        // Using { fullPage: true } is broken so set viewport to size of HTML body
        const boundingBox = (yield ((_a = (yield page.$('body'))) === null || _a === void 0 ? void 0 : _a.boundingBox()));
        if (!boundingBox)
            return (0, __1.error)("Error occured with build revision screenshot, continuing program", false);
        boundingBox.height = Math.floor(boundingBox.height);
        boundingBox.width = Math.floor(boundingBox.width);
        yield page.setViewport(boundingBox);
        yield page.reload();
        yield sleep(5000);
        const screenshot = yield page.screenshot({ fullPage: true });
        yield browser.close();
        const image = (0, sharp_1.default)(screenshot);
        const { width, height } = yield image.metadata();
        if (!width || !height)
            throw new Error('this will never happen');
        // Find how many pieces to slice into
        const dif = height > width ? Math.sqrt(height / width) : Math.sqrt(width / height);
        const lower = Math.floor(dif);
        const upper = Math.ceil(dif);
        // Halfway point in rounding is where integral x from lower -> dif == integral x from dif -> upper
        const pieces = lower + Math.round((dif ** 2 - lower ** 2) / (upper ** 2 - lower ** 2));
        const pieceHeight = Math.floor(height / pieces);
        const slices = [];
        for (let piece = 0; piece < pieces; piece++) {
            const copy = image.clone();
            slices.push(yield copy.extract({ left: 0, top: piece * pieceHeight, height: pieceHeight, width }).toBuffer());
        }
        const nimageObj = (0, sharp_1.default)({
            create: {
                width: width * pieces + 10 * (pieces - 1),
                height: pieceHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        });
        const nimageBuffer = nimageObj.composite(slices.map((x, i) => ({
            input: x,
            left: width * i + 10 * (i - 1),
            top: 0
        })));
        return nimageBuffer.toFormat('jpeg').toBuffer();
    });
}
exports.photographSite = photographSite;
