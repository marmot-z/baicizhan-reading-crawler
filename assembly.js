// 读取输出的目录
// 读取爬取的信息进行拼装

const fs = require('fs');
const https = require('https');
const path = require('path');

async function assembly(readingDatas, outputPath = './bin') {    
    if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, {recursive: true, force: true});
    }

    fs.mkdirSync(outputPath);

    console.log('开始拼装书籍内容');

    for (let [journalName, datas] of Object.entries(readingDatas)) {
        const journalPath = path.resolve(outputPath, journalName);
        fs.mkdirSync(journalPath);

        const groupByBookName = groupBy(datas, 'book_name');

        for (let bookName of Object.keys(groupByBookName)) {
            const bookPath = path.resolve(journalPath, bookName);
            fs.mkdirSync(bookPath);

            for (let data of groupByBookName[bookName]) {
                if (!data.book_name) {
                    continue;
                }
    
                const chapterPath = path.resolve(bookPath, `chapter-${data.current_chapter}`);
                fs.mkdirSync(chapterPath);

                assemblyHtml(data, chapterPath);
                await downloadAudios(data, chapterPath);
            }

            assemblyMarkdown(bookName, groupByBookName[bookName], bookPath);
        }         
    }
}

const htmlTemplate = `
    <html lang="zh-CN">
        <head>
            <meta charset="utf-8">
            <link href="../../../../assets/bootstrap-5.0.2-dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <div class="row">
                    <div class="col"></div>
                    <div class="col-8">
                        <br> 
                        <blockquote class="blockquote">
                            <p class="mb-0" style="font-size: medium;">$previous</p>
                        </blockquote>
                        <hr>
                        <br>                          
                        <div>$sentences</div>
                    </div>
                    <div class="col"></div>
                </div>
            </div>
        </body>
    </html>
`;

function assemblyHtml(data, parentPath) {
    const sentencesHtml = data.article_info.sentences
                            .map(sentence => `<p class="text-left">${sentence.sentence}</p>`)
                            .join('\n');
    const html = htmlTemplate.replace('$previous', data.article_info.previous)
                    .replace('$sentences', sentencesHtml);
    const indexHtmlPath = path.resolve(parentPath, 'index.html');

    fs.writeFileSync(indexHtmlPath, html);
}

async function downloadAudios(data, parentPath) {
    const audiosFloderPath = path.resolve(parentPath, 'audios');
    fs.mkdirSync(audiosFloderPath);

    const speeds = Object.keys(data.article_info.audio_info.audio_info_by_speed);
    
    return new Promise((resolve) => {
        for (let speed of speeds) {
            const audioInfo = data.article_info.audio_info.audio_info_by_speed[speed];
            const fileExtension = audioInfo.audio_name.substring(audioInfo.audio_name.lastIndexOf('.'));
            const file = fs.createWriteStream(path.resolve(audiosFloderPath, speed + fileExtension));

            https.get(`https://${audioInfo.audio_url}`, function(response) {
                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    resolve();
                    console.log(`Download ${audioInfo.audio_name} Completed`);                    
                });
            });    
        }
    });
}

function assemblyMarkdown(bookName, datas, parentPath) {
    const mdPath = path.resolve(parentPath, `${bookName}.md`);
    const content = datas.map(info => info.article_info.sentences)
            .map(sentences => sentences.map(s => s.sentence).join('\n\n'))
            .join('\n<hr>\n');

    fs.writeFileSync(mdPath, content);
}

function groupBy(xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

module.exports = assembly;