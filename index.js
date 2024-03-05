// 爬取：
// 1，获取当前训练营信息
// 2，获取当前阅读数据信息以及时间周期
// 3，获取对应章节信息，并且保存到当前库中

// 组装成 html：
// 读取 json 文件绘制成 html
// 加载 mp3 文件，按照时间打点同步文本和音频进度
//
// 组装成 Markdown 文件：
// 

const fs = require('fs');
const Crawler = require('./crawler');
const assembly = require('./assembly');

(async() => {
    const token = 'BAhJIiFvXzNIRnY1NkVLckZjd01HLU1QdW53LUxjT1pRBjoGRVQ%3D--3b58253c8c7d925d0327c073b0d6dfc4601f3b54';
    const readingDatas = await new Crawler(token).doCrawle();
    // const readingDatas = loadMockData();
    const outputPath = './bin';

    assembly(readingDatas, outputPath);
}) ();

function loadMockData() {
    const content = fs.readFileSync('./json/total2.json', 'utf8');
    return JSON.parse(content);
}