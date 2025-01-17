import React, { useEffect, useState, useReducer } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import withDom, { withDomGen, useTargetDom, runContentScript } from "./utils/chrome/access";
import { unpackReducer, timeout } from "./utils/utils";

import { messages } from "@extend-chrome/messages";

import domtoimage from "dom-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function App() {
    // const [targetDom, fetchTargetDom, isTargetDomReady] = useTargetDom();

    messages.on((message, sender, sendResponse) => {
        if (message.greeting != "greeting from content-script.js") return;

        console.log("========================================");
        console.log(sender.id, "said hello");
        console.log("message:", message);
        console.log("========================================");

        // sendResponse({ farewell: "goodbye" });
    });

    const [meta, setMeta] = useReducer(unpackReducer, {
        chapter: 0,
        title: "KoibitoMuriMuri",
        filenamePrefix: `KoibitoMuriMuri Ch.0`,
    });

    useEffect(() => {
        setMeta({ filenamePrefix: `${meta.title} Ch.${meta.chapter}` });
    }, [meta.chapter, meta.title]);

    // useEffect(() => {
    //     while (!isTargetDomReady);
    //     const chapter = targetDom.getElementsByClassName("episode_title")[0].textContent.match(/\d+/)[0];
    //     setMeta({ chapter });
    // }, []);

    const [pageRanges, setPageRanges] = useReducer(unpackReducer, {
        startPage: 0,
        endPage: 60,
    });

    const mainTest = async () => {

        runContentScript();
        messages.send({
            greeting: "greeting from app.js",
            data: "",
        });
    };

    return (
        <>
            <div className="container">
                <h1>MEextention</h1>

                <div className="m-3 p-3">isTargetReady: {isTargetDomReady + ""}</div>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        mainTest();
                    }}
                >
                    MainTest
                </button>

                <button
                    className="m-3 p-3"
                    onClick={() => {
                        fetchTargetDom();
                    }}
                >
                    FetchTargetDom
                </button>
            </div>
        </>
    );
}
