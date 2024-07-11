import puppeteer, { Page } from 'puppeteer';
import fs from 'fs';
require('dotenv').config();

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Scrapes instagram
 * @returns string[]
 */
export async function instagramScraper(handle: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = (await browser.pages())[0];

    console.log('Opening instagram.com');
    await page.goto("https://www.instagram.com", { waitUntil: 'networkidle2' });
    console.log('Logging into account');

    await page.click('#loginForm input[name="username"]');
    await page.keyboard.type(process.env['INSTA_USER']!, { delay: 50 });
    await page.click('#loginForm input[name="password"]');
    await page.keyboard.type(process.env['INSTA_PASS']!, { delay: 50 });

    await page.click('#loginForm button[type="submit"]');

    console.log('Loading and scraping page for @' + handle);
    await page.goto('https://www.instagram.com/' + handle, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const igdata =  await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const ppurl = images[3].src;
        const thumbnails = images.filter(x => x.classList.length == 6).map(x => ({ alt: x.alt, src: x.src }));

        const bioElement = document.querySelector('section > div > span > div > span');
        
        return {
            profilePicture: ppurl,
            bio: bioElement ? bioElement.textContent : "",
            thumbnails,
        }
    });

    await browser.close();

    return igdata;
};