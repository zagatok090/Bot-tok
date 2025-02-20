const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
const fs = require('fs');
const { executablePath } = require('puppeteer');
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const figlet = require('figlet');

puppeteer.use(StealthPlugin());

const VIDEO_URL = 'https://www.youtube.com/watch?v=VIDEO_ID';
const WATCH_TIME = 5 * 60 * 1000;

// Verifica si los archivos existen antes de leerlos
let ACCOUNTS = [];
let PROXIES = [];

try {
    ACCOUNTS = JSON.parse(fs.readFileSync('accounts.json'));
    PROXIES = JSON.parse(fs.readFileSync('proxies.json'));
} catch (error) {
    console.error('Error al leer los archivos accounts.json o proxies.json:', error);
}

const bot = new TelegramBot('YOUR_TELEGRAM_BOT_TOKEN', { polling: true });
const app = express();

bot.onText(/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Bienvenido al bot de interacción. Usa /status para ver el estado.');
});

bot.onText(/status/, (msg) => {
    bot.sendMessage(msg.chat.id, 'El bot está ejecutándose.');
});

app.get('/status', (req, res) => {
    res.json({ status: 'Bot ejecutándose', accounts: ACCOUNTS.length });
});

(async () => {
    for (const account of ACCOUNTS) {
        const proxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
        console.log(figlet.textSync('BOT MASTER'));
        console.log(`Iniciando sesión con ${account.username}`);

        const browser = await puppeteer.launch({
            headless: false,
            executablePath: executablePath(),
            args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent(randomUseragent.getRandom());
        await page.setViewport({ width: 1280, height: 720 });

        await page.goto(VIDEO_URL, { waitUntil: 'networkidle2' });

        try {
            await page.waitForSelector('.ytp-play-button', { timeout: 5000 });
            await page.click('.ytp-play-button');
        } catch (error) {
            console.log('No se encontró el botón de play.');
        }

        await page.waitForTimeout(WATCH_TIME);

        try {
            await page.waitForSelector('button[aria-label="Me gusta"]', { timeout: 5000 });
            await page.click('button[aria-label="Me gusta"]');
            console.log(`Like dado con la cuenta ${account.username}`);
        } catch (error) {
            console.log('No se encontró el botón de like o ya se dio like.');
        }

        await page.waitForTimeout(2000 + Math.random() * 3000);
        await browser.close();
        console.log(`Cerrando sesión con ${account.username}\n`);
    }
})();

app.listen(3000, () => {
    console.log('Servidor web corriendo en http://localhost:3000');
});
