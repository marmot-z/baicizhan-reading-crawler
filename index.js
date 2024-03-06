const fs = require('fs');
const Crawler = require('./crawler');
const assembly = require('./assembly');

(async() => {
    const token = process.env.token;
    const readingDatas = await new Crawler(token).doCrawle();
    // const readingDatas = loadMockData();
    const outputPath = './bin';

    assembly(readingDatas, outputPath);
}) ();

function loadMockData() {
    const content = fs.readFileSync('./json/total2.json', 'utf8');
    return JSON.parse(content);
}