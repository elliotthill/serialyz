import https from "https"
import http from "http"
import config from "../config.json"

export const fetchURL = async (url: URL) : Promise<string> => {

    const getProtocol = (url.protocol === "https:") ? https.get : http.get

    return new Promise((resolve, reject) => {

        const controller = new AbortController()

        setTimeout(() => {
            controller.abort()
        }, config.POLLING_URL_TIMEOUT)

        const options = {
            signal: controller.signal, //Timeout
            headers: {
                'User-Agent': config.USER_AGENT
            }
        };

        getProtocol(url,options, (res) => {
            let body = ""
            res.setEncoding('utf8')

            if (res.statusCode === undefined || res.statusCode !== 200) {
                console.warn(`Failed crawling URL:${url}`)
                reject()
            }

            res.on('data', (d) => {
                body += d
            });

            res.on('end', () => {
                resolve(body)
            });

        }).on('error', (e) => {

            //Wait even longer as we might be banned/rate limited
            reject(e)
        });
    });

}

export const postURL = async (url: URL, postData:any) : Promise<string> => {

    const request = (url.protocol === "https") ? https.request : http.request
    const data = JSON.stringify(postData);


    return new Promise((resolve, reject) => {

        const controller = new AbortController()

        setTimeout(() => {
            controller.abort()
        }, config.POLLING_URL_TIMEOUT)

        const options = {
            method: 'POST',
            signal: controller.signal, //Timeout
            headers: {
                'User-Agent': config.USER_AGENT,
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            }
        }
        console.log(`postURL ${url}`);
        const req = request(url, options, (res) => {
            console.log(res.statusCode);
            let body = ""
            res.setEncoding('utf8')

            if (res.statusCode === undefined || res.statusCode !== 200) {
                console.warn(`Failed crawling URL:${url}`)
                reject(res.statusCode?.toString())
            }

            res.on('data', (d) => {
                body += d
            });

            res.on('end', () => {
                resolve(body)
            });
        });

        req.on('error', (e) => {

            //Wait even longer as we might be banned/rate limited
            reject(e)
        })

        req.write(data)
        req.end()

    });
}