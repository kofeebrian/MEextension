import domtoimage from "dom-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import _ from "lodash";
import { cycle, zip } from "iter-tools";

// import { storageGet } from "../utils/chrome/storage";

import { timeout, zeroPad } from "../utils/utils";

// const CHAPTER = window.location.href.split("/")[6];
// const TITLE = window.location.href.split("/")[4];

const END_POINT_URL = "https://ssl.seiga.nicovideo.jp";
const EPISODE_ID = new URL(window.location).searchParams.get("cid");
const FRAMES_URL = `${END_POINT_URL}/api/v1/comicwalker/episodes/${EPISODE_ID}/frames`;
const META_URL = `${END_POINT_URL}/api/v1/comicwalker/episodes/${EPISODE_ID}`;

const START_PAGE = 0;
const END_PAGE = 60;

// https://stackoverflow.com/questions/14603205/how-to-convert-hex-string-into-a-bytes-array-and-a-bytes-array-in-the-hex-strin
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

async function main() {
    // const { CHAPTER, TITLE, START_PAGE, END_PAGE } = await storageGet(["CHAPTER", "TITLE", "START_PAGE", "END_PAGE"]);

    const {
        data: { data: meta },
    } = await axios.get(META_URL);

    const TITLE = meta.extra.content.title; // "雨でも晴れでも"
    const CHAPTER = meta.result.title; // "第14話-②"
    const FILENAME_PREFIX = `${CHAPTER} ${TITLE}`;

    console.log(`Start extract on: ${FILENAME_PREFIX}`);

    const {
        data: {
            data: { result: frames },
        },
    } = await axios.get(FRAMES_URL);

    const framesRes = await axios.all(
        frames.map((frame) => axios.get(frame.meta.source_url, { responseType: "arraybuffer" }))
    );
    const contents = framesRes.map((frameRes) => new Uint8Array(frameRes.data));

    const drmHashes = frames.map((frame) => frame.meta.drm_hash);

    const imageStrings = _.zip(contents, drmHashes).map(([content, drmHash]) => {
        const hash = hexToBytes(drmHash.substr(0, 16));
        const bytes = [...zip(content, cycle(hash))].map(([i, j]) => i ^ j);
        const byteString = bytes.reduce((str, byte) => str + String.fromCharCode(byte), "");
        const base64String = window.btoa(byteString);
        return base64String;
    });

    const dataUrls = imageStrings.map((imageString, idx) => ({ pageId: idx + 1, dataUrl: `base64,${imageString}` }));

    zipAndDownload(dataUrls, FILENAME_PREFIX, CHAPTER);
}

/**
 *  Helpers
 */

function zipAndDownload(dataUrls, FILENAME_PREFIX, CHAPTER) {
    console.log("Finalized");

    const zip = new JSZip();
    const folder = zip.folder(FILENAME_PREFIX);

    dataUrls.forEach(({ pageId, dataUrl }) => {
        const imageString = dataUrl.split("base64,")[1];
        folder.file(`${FILENAME_PREFIX}/Ch-${CHAPTER} Pg-${zeroPad(pageId)}.png`, imageString, { base64: true });
    });

    folder.generateAsync({ type: "blob" }).then((content) => saveAs(content, FILENAME_PREFIX));
}

// === Main ===
main();
