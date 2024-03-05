// 爬取：
// 1，获取当前训练营信息
// 2，获取当前阅读数据信息以及时间周期
// 3，获取对应章节信息，并且保存到当前库中

const fetch = require('node-fetch');
const date = require('date-and-time');

const host = 'reading.baicizhan.com';
const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.12(0x17000c21) NetType/WIFI Language/zh_CN';
const referer = 'http://reading.baicizhan.com/h5/reading.html';

class Crawler {
    constructor(readinToken) {
        this.readinToken = readinToken;
    }

    async doCrawle() {
        const currentShowTermInfo = await this.getCurrentShowTermInfo();
        const result = {};

        console.log(`当前共有 ${currentShowTermInfo.data.reading_info.length} 期阅读训练营内容：`);
        console.log(`${currentShowTermInfo.data.reading_info.map(info => `- ${info.learn_term_info.term_info.term_name}`).join('\n')}`);

        for (let readingInfo of currentShowTermInfo.data.reading_info) {
            let termInfo = readingInfo.learn_term_info.term_info;
            const bookInfos = await this.getLearnBookInfo(termInfo.term_id);
            let startDay = date.parse(bookInfos.term_info.start_day, 'YYYY-MM-DD'); 
            let endDay = date.parse(bookInfos.term_info.end_day, 'YYYY-MM-DD'); 
            const readingDatas = [];

            console.log(`===========================================`);
            console.log(`开始爬取「${termInfo.term_name}」阅读训练营内容`);

            do {
                console.log(`开始爬取 ${date.format(startDay, 'YYYY-MM-DD')} 日阅读内容`);

                const readingData = await this.getReadingData(termInfo.term_id, date.format(startDay, 'YYYY-MM-DD'));
                if (readingData.bid) {
                    readingDatas.push(readingData);
                }

                startDay = date.addDays(startDay, 1);                
            } while (startDay.getTime() <= endDay.getTime());

            result[termInfo.term_name] = readingDatas;
        }

        return result;
    }

    /**
     * 获取当前训练营信息
     */
    getCurrentShowTermInfo() {
        const url = `https://${host}/api/v1/read/get_current_show_term_info?timestamp=${new Date().getTime()}`;

        return this.doFetch(url);
    }

    /**
     * 获取在学习的书籍
     * 
     * @param {Number} termId
     */
    async getLearnBookInfo(termId) {
        const url = `https://${host}/api/get_learn_book_info?term_id=${termId}&timestamp=${new Date().getTime()}`;

        return this.doFetch(url, {
            'accept': 'application/json, text/javascript, */*; q=0.01',
        });
    }

    /**
     * 获取阅读数据
     * 
     * @param {String} termId 
     * @param {String} date 
     */
    async getReadingData(termId, date) {
        const url = `https://${host}/api/1709559515000/get_reading_data.json?date=${date}&term_id=${termId}&timestamp=${new Date().getTime()}`;

        return this.doFetch(url, {
            'accept': '*/*',
        });
    }

    async doFetch(url, headers = {}) {
        const defaultHeaders = {
            'Host': host,
            'Cookie': `readin_token=${this.readinToken};`,
            'x-requested-with': 'XMLHttpRequest',
            'accept-language': 'zh-CN,zh-Hans;q=0.9',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'user-agent': userAgent,
            'referer': referer,
        };
        const actualHeaders = Object.assign(defaultHeaders, headers);

        return fetch(url, {headers: actualHeaders})
            .then(response => response.json());
    }
}

module.exports = Crawler;