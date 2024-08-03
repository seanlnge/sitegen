"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonParse = jsonParse;
exports.xmlParse = xmlParse;
exports.sleep = sleep;
/**
 * Finds and returns first instance of completed JSON inside a string
 * @param str String that has JSON
 * @returns Valid JSON or null if no valid JSON found
 */
function jsonParse(str) {
    let start = str.indexOf("{");
    if (start == -1)
        return undefined;
    let json = "";
    let depth = 0;
    for (let i = start; i < str.length; i++) {
        if (str[i] == "{")
            depth++;
        if (str[i] == "}")
            depth--;
        json += str[i];
        if (depth == 0)
            return JSON.parse(json);
    }
    return null;
}
/**
 * Finds and returns children of first instance of a specified XML tag inside a string
 * @param str String that has XML
 * @param tag Tag to look for
 */
function xmlParse(str, tag) {
    const opens = Array.from(str.matchAll(new RegExp(`<${tag}>`, "g"))).map(x => x.index);
    const closes = Array.from(str.matchAll(new RegExp(`</${tag}>`, "g"))).map(x => x.index);
    if (opens.length == 0 || closes.length == 0)
        return null;
    let start = opens.shift();
    let end = start;
    let depth = 1;
    while (closes[0]) {
        if (opens[0] && opens[0] < closes[0]) {
            opens.shift();
            depth++;
            continue;
        }
        end = closes.shift();
        if (--depth == 0)
            return str.slice(start + tag.length + 2, end);
    }
    return null;
}
function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}
