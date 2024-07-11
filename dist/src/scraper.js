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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instagramScraper = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
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
        console.log('Opening instagram.com');
        yield page.goto("https://www.instagram.com", { waitUntil: 'networkidle2' });
        console.log('Logging into account');
        yield page.click('#loginForm input[name="username"]');
        yield page.keyboard.type(process.env['INSTA_USER'], { delay: 50 });
        yield page.click('#loginForm input[name="password"]');
        yield page.keyboard.type(process.env['INSTA_PASS'], { delay: 50 });
        yield page.click('#loginForm button[type="submit"]');
        console.log('Loading and scraping page for @' + handle);
        yield page.goto('https://www.instagram.com/' + handle, { waitUntil: 'networkidle2' });
        yield sleep(2000);
        const igdata = yield page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const ppurl = images[3].src;
            const thumbnails = images.filter(x => x.classList.length == 6).map(x => ({ alt: x.alt, src: x.src }));
            const bioElement = document.querySelector('section > div > span > div > span');
            return {
                profilePicture: ppurl,
                bio: bioElement ? bioElement.textContent : "",
                thumbnails,
            };
        });
        yield browser.close();
        return igdata;
    });
}
exports.instagramScraper = instagramScraper;
;
