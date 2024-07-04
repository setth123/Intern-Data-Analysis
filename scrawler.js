import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
    //init
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    //crawling data
    try {
        //request to get number of pages
        await page.goto('https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-tai-ha-noi-l1c10131t5?company_field=1&page=1');
        await page.waitForSelector('span#job-listing-paginate-text', { timeout: 60000 });

        //take number of pages
        const totalPages = await page.evaluate(() => {
            const element = document.querySelector('span#job-listing-paginate-text');
            if (element) {
                const text = element.textContent;
                const match = text.match(/\/\s*(\d+)\s*trang/);
                return match ? parseInt(match[1], 10) : null;
            }
            return null;
        });

        if (totalPages !== null) {
            const content = [];
            let str=null;
            //condition to check
            const flag=false;
            let existedContent=[];
            if (fs.existsSync('content.json')) {
                const rawData = fs.readFileSync('content.json', 'utf-8');
                existedContent = JSON.parse(rawData);
                str = existedContent[0];
            }
            //requests to get all the elements by looping though each pages
            for (let i = 1; i <= totalPages; i++) {

                //request to the specific page
                const url = `https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-tai-ha-noi-l1c10131t5?company_field=1&page=${i}`;
                await page.goto(url);

                //get specific elements
                const pageContent = await page.evaluate((str) => {
                    const elements = document.querySelectorAll('span[data-toggle="tooltip"][data-container="body"][data-placement="top"]');
                    const obj={
                        contents:[],
                        flag:false
                    };
                    for (const element of elements) {
                        if (element.textContent === str) {
                            obj.flag=true; 
                            return obj;
                        }
                        obj.contents.push(element.textContent);
                    }
                    return obj;
                },str);
                //check the condition 
                if(pageContent.flag){
                    break;
                }
                content.push(...pageContent.contents);
            }
            //save to content.json

            existedContent.push(...content);
            fs.writeFileSync("content.json", JSON.stringify(existedContent, null, 2));
        }
    //catch errors
    } catch (error) {
        console.error(error);
    //close browser
    } finally {
        await browser.close();
    }
})();
