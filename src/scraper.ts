import puppeteer, { KnownDevices } from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import { error, log } from '..';
import { Options } from '.';
require('dotenv').config();

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export type ScrapedImage = {
    source: string,
    caption: string,
};

/**
 * Scrapes instagram
 * @returns string[]
 */
export async function instagramScraper(handle: string, options: Options) {
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
    await page.goto('https://www.instagram.com/' + handle, { waitUntil: 'networkidle0' });

    const igdata = await page.evaluate((handle) => {
        const images = Array.from(document.querySelectorAll('img'));
        const ppurl = (document.querySelector(`img[alt="${handle}'s profile picture"]`) as HTMLImageElement)?.src;
        const scrapedImages = images.filter(x => x.classList.length == 6).map(x => ({ caption: x.alt, source: x.src }));
        const bioElement = document.querySelector('section > div > span > div > span');
        
        return {
            profilePicture: ppurl,
            bio: bioElement ? bioElement.textContent ?? "" : "",
            images: scrapedImages as ScrapedImage[],
        }
    }, handle);

    await browser.close();

    return {
        bio: igdata.bio,
        images: igdata.images.slice(0, options.photoCount),
        profilePicture: igdata.profilePicture
    };
};

export async function facebookScraper(handle: string, options: Options) {
    const browser = await puppeteer.launch({ headless: true });
    const page = (await browser.pages())[0];

    log('Opening facebook.com');
    await page.goto("https://www.facebook.com", { waitUntil: 'networkidle2' });
    log('Logging into account');

    await page.click('#email');
    await page.keyboard.type(process.env['FACEBOOK_EMAIL']!, { delay: 50 });
    await page.click('#pass');
    await page.keyboard.type(process.env['FACEBOOK_PASS']!, { delay: 50 });
    await page.click('button[name="login"]');
    await sleep(5000);

    log('Loading and scraping page for ' + handle);
    await page.goto('https://www.facebook.com/' + handle, { waitUntil: 'networkidle0' });

    const fbdata = await page.evaluate(() => {
        const bio = document.querySelectorAll("div > ul")[1].parentElement!.parentElement!.parentElement!.innerText;
        return { bio, images: [] };
    });

    await browser.close();

    return fbdata;
}

export async function photographSite(siteUrl: string) {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = (await browser.pages())[0];

    await page.emulate(KnownDevices['iPhone 12 Pro']);

    await page.goto(path.resolve(siteUrl));

    // Using { fullPage: true } is broken so set viewport to size of HTML body
    const boundingBox = (await (await page.$('body'))?.boundingBox());
    if(!boundingBox) {
        error("Error occured with screenshot, please retry program", true);
        process.exit(); // shouldn't get here since error ends program
    }
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