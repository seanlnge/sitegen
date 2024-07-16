import puppeteer, { KnownDevices } from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import { error, log } from '..';
require('dotenv').config();

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Scrapes instagram
 * @returns string[]
 */
export async function instagramScraper(handle: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = (await browser.pages())[0];

    log('Opening instagram.com');
    await page.goto("https://www.instagram.com", { waitUntil: 'networkidle2' });
    log('Logging into account');

    await page.click('#loginForm input[name="username"]');
    await page.keyboard.type(process.env['INSTA_USER']!, { delay: 50 });
    await page.click('#loginForm input[name="password"]');
    await page.keyboard.type(process.env['INSTA_PASS']!, { delay: 50 });

    await page.click('#loginForm button[type="submit"]');

    log('Loading and scraping page for @' + handle);
    await page.goto('https://www.instagram.com/' + handle, { waitUntil: 'networkidle2' });
    await sleep(3000);

    const igdata = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const ppurl = images.filter(x => x.classList.length == 18)[1].src;
        const thumbnails = images.filter(x => x.classList.length == 6).map(x => ({ alt: x.alt, src: x.src }));

        const bioElement = document.querySelector('section > div > span > div > span');
        
        return {
            profilePicture: ppurl,
            bio: bioElement ? bioElement.textContent ?? "" : "",
            thumbnails,
        }
    });

    await browser.close();

    return igdata;
};

export async function photographSite(siteUrl: string) {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = (await browser.pages())[0];

    await page.emulate(KnownDevices['iPhone 12 Pro']);

    await page.goto(path.resolve(siteUrl));

    // Using { fullPage: true } is broken so set viewport to size of HTML body
    const boundingBox = (await (await page.$('body'))?.boundingBox());
    if(!boundingBox) return error("Error occured with build revision screenshot, continuing program", false);
    boundingBox.height = Math.floor(boundingBox.height);
    boundingBox.width = Math.floor(boundingBox.width);
    await page.setViewport(boundingBox);

    await page.reload();
    await sleep(5000);
    
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();
    const image = sharp(screenshot);

    const { width, height } = await image.metadata();
    if(!width || !height) throw new Error('this will never happen');

    // Find how many pieces to slice into
    const dif = height > width ? Math.sqrt(height / width) : Math.sqrt(width / height);
    const lower = Math.floor(dif);
    const upper = Math.ceil(dif);
    
    // Halfway point in rounding is where integral x from lower -> dif == integral x from dif -> upper
    const pieces = lower + Math.round((dif ** 2 - lower ** 2) / (upper ** 2 - lower ** 2));
    const pieceHeight = Math.floor(height / pieces);

    const slices = [];
    for(let piece=0; piece<pieces; piece++) {
        const copy = image.clone();
        slices.push(await copy.extract({ left: 0, top: piece * pieceHeight, height: pieceHeight, width }).toBuffer());
    }

    const nimageObj = sharp({
        create: {
            width: width * pieces + 10 * (pieces - 1),
            height: pieceHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    });

    const nimageBuffer = nimageObj.composite(slices.map((x, i) => ({
        input: x,
        left: width * i + 10 * (i-1),
        top: 0
    })));

    return nimageBuffer.toFormat('jpeg').toBuffer();
}