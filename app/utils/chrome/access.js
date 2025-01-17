import React, { useEffect, useState } from "react";

export function getCurrentTabId(tabCallback) {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabArray) => {
        tabCallback(tabArray[0].id);
    });
}

export default function withDom(func) {
    return _withDom(func, () => {});
}

export function withDomGen(setHook) {
    return (func) => _withDom(func, setHook);
}

export async function _withDom(func, setHook = () => {}) {
    // function func() {
    //     // You can play with your DOM here or check URL against your regex
    //     // Log to the main console
    //     console.log("Tab script:");
    //     console.log(document.body);
    //     return document.body.innerHTML;
    // }

    // https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content
    // We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript
    return getCurrentTabId((tabId) =>
        chrome.scripting.executeScript(
            {
                target: { tabId },
                function: func,
            },
            (res) => {
                // https://www.py4u.net/discuss/284401
                setHook(res);
            }
        )
    );
}

/**
 * =================================================
 *
 * const [targetDom, fetchTargetDom, isTargetDomReady] = useTargetDom();
 *
 * =================================================
 *
 * https://developer.mozilla.org/en-US/docs/Web/Guide/Parsing_and_serializing_XML
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer
 */
export function useTargetDom() {
    const [isTargetDomReady, setIsTargetDomReady] = useState(false);
    const [targetDom, setTargetDom] = useState({});
    const [targetDomString, setTargetDomString] = useState("");
    const Parser = new DOMParser();

    useEffect(() => {
        if (!targetDomString) return;

        const parsedTargetDom = Parser.parseFromString(targetDomString, "application/xml");

        setTargetDom(parsedTargetDom);
        setIsTargetDomReady(true);
    }, [targetDomString]);

    const fetchTargetDom = () => {
        setIsTargetDomReady(false);

        withDomGen(setTargetDomString)(() => {
            const Serializer = new XMLSerializer();
            return Serializer.serializeToString(document);
        });
    };

    useEffect(() => {
        fetchTargetDom();
    }, []);

    return [targetDom, fetchTargetDom, isTargetDomReady];
}

// export async function getTargetDom() {

//     const domString = await _withDom(() => {
//         const Serializer = new XMLSerializer();
//         return Serializer.serializeToString(document.getElementsByClassName("episode_title")[0]);
//     });
//     console.log("========================================");
//     console.log("domString:", domString);
//     console.log("========================================");

//     const Parser = new DOMParser();
//     const targetDom = Parser.parseFromString(domString, "application/xml");
//     return targetDom;
// }

export function runContentScript() {
    return getCurrentTabId((tabId) =>
        chrome.scripting.executeScript(
            {
                target: { tabId },
                files: ["content-script.js"],
            }
        )
    );
}