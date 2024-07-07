export function jsonParse(str: string) {
    let start = str.indexOf("{");
    if(start == -1) return undefined;

    let json = "";
    let depth = 0;

    for(let i=start; i<str.length; i++) {
        if(str[i] == "{") depth++;
        if(str[i] == "}") depth--;

        json += str[i];
        if(depth == 0) return JSON.parse(json);
    }
    return undefined;
}