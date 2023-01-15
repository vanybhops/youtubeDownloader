import { appendFileSync } from "fs";
import nodeFetch from "node-fetch"
import stream from "stream";

let headers = {
    "accept": "*/*",
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
}
export const download = (url: string) => {
    nodeFetch(url, {
        "headers": headers,
        "method": "GET",
    }).then(async (resp: any) => {
        let response = await resp.text()
        let titleName = String(response.match(/(?<="title":")(.*?)(?=",")/gm))
        let matches: IterableIterator<RegExpMatchArray> = response.matchAll(/(?<="adaptiveFormats":)(.*?}])}/gm)
        let groupMatch: string = "";
        for (let match of matches) {
            groupMatch = match[1]
        }
        let files: Array<any> = JSON.parse(groupMatch)
        for (const value of files) {
            if (value?.fps === undefined) {
                let mimeType = value.mimeType.split("; ")[0]
                mimeType = mimeType.split("\/")[1]
                if (value?.url == undefined) {
                    let downloadURL: string = decodeURIComponent(value.signatureCipher)
                    let sig: string = downloadURL.split("&sp=sig")[0]

                    downloadURL = downloadURL.split("https://")[1]
                    sig = sig.substring(5, sig.length - 2)
                    let formatedUrl: string = "https://" + downloadURL + "&sig=" + sig
                    await downloadSound(formatedUrl, mimeType, titleName)
                } else {
                    await downloadSound(value.url, mimeType, titleName)
                }
                return
            }
        }
    })
}
async function downloadSound(url: string, mimeType: string, titleName: string): Promise<any> {
    return new Promise<void>(async (resolve, reject) => {
        const resp = await nodeFetch(url, {
            "headers": {
                "accept": "audio/*",
                "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
            },
            method: "GET"
        })
        let total: number = Number(resp.headers.get("content-length")) ?? 0
        const readStream = stream.Readable.from(resp.body);
        const format = `${titleName}.${mimeType}`
        let loaded: number = 0;
        readStream.on("data", data => {
            loaded += data.length
            let consoleWidth = process.stdout.columns
            const percentage = Math.round(
                (loaded * consoleWidth) / total
            );
            console.clear()
            let formatForPrint = "#".repeat(percentage) + "_".repeat(consoleWidth - percentage) + "\n" + `${" ".repeat(Math.floor(consoleWidth / 2 - format.length / 2))}${format}`
            process.stdout.write(formatForPrint)
            appendFileSync(format, data)
        })
        readStream.on("end", () => {
            resolve()
        })
        readStream.on("error", () => {
            reject()
        })
    })
}