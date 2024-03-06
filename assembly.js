const fs = require('fs');
const https = require('https');
const path = require('path');

function assembly(readingDatas, outputPath = './bin') {    
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
                fs.writeFileSync(path.resolve(chapterPath, 'audio.js'), `const audioInfo = ${JSON.stringify(data.article_info.audio_info)};`);
            }

            assemblyMarkdown(bookName, groupByBookName[bookName], bookPath);
        }         
    }
}

const htmlTemplate = `
    <html lang="zh-CN">
        <head>
            <meta charset="utf-8">
            <title>$title</title>
            <link href="../../../../assets/bootstrap-5.0.2-dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="../../../../assets/bootstrap-5.0.2-dist/css/bootstrap.min.css.map" rel="stylesheet">
            <style type="text/css">
                .p-active {
                    font-weight: bold;
                    color: #198754;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="row">
                    <div class="col">
                        <img id="previousChapterButton" src="../../../../assets/bootstrap-5.0.2-dist/icons/arrow-left-square.svg"                             
                            style="position: sticky; top: 40%; width: 32; height: 32; cursor: pointer;">
                    </div>
                    <div class="col-8">
                        <br> 
                        <blockquote class="blockquote">
                            <p class="mb-0" style="font-size: medium;">$previous</p>
                        </blockquote>
                        <hr>                                           
                        <audio preload="auto" src="$audioSrc"></audio>                          
                        <br> 
                        <div>$sentences</div>
                    </div>
                    <div class="col">
                        <img id="nextChapterButton" src="../../../../assets/bootstrap-5.0.2-dist/icons/arrow-right-square.svg" 
                            style="position: sticky; top: 40%; float:right; width: 32; height: 32; cursor: pointer;">
                    </div>
                </div>
            </div>
        </body>        
        <script>
            const currentChapter = $currentChapter, totalChapter = $totalChapter;   
        </script>
        <script src="./audio.js"></script>        
        <script src="../../../../assets/jquery-3.3.1/jquery-3.3.1.slim.min.js"></script>        
        <script src="../../../../assets/audioplayer/audio.min.js"></script>
        <script src="../../../../assets/view.js"></script>
    </html>
`;

function assemblyHtml(data, parentPath) {
    const sentencesHtml = data.article_info.sentences
                            .map(sentence => `<p class="text-left">${sentence.sentence}</p>`)
                            .join('\n');
    const html = htmlTemplate.replace('$previous', data.article_info.previous)
                    .replace('$sentences', sentencesHtml)
                    .replace('$title', `${data.book_name} ${data.article_info.article_title}`)
                    .replace('$currentChapter', `${data.current_chapter}`)
                    .replace('$totalChapter', `${data.total_chapter}`)
                    .replace('$audioSrc', `https:${data.article_info.audio_info.audio_url}`);
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