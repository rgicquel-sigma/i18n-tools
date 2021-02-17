#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { consoleOutput } from './console-output.js';
function readDir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(files);
            }
        });
    });
}
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
function writeFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, JSON.stringify(data, null, '\t'), err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function orderKeysRecursive(data, keepOrderDepth = 0) {
    if (data === null || typeof (data) !== 'object') {
        return data;
    }
    if (keepOrderDepth > 0) {
        for (let key of Object.keys(data)) {
            data[key] = orderKeysRecursive(data[key], keepOrderDepth - 1);
        }
        return data;
    }
    else {
        return Object.keys(data).sort().reduce((obj, key) => {
            obj[key] = orderKeysRecursive(data[key], keepOrderDepth - 1);
            return obj;
        }, {});
    }
}
function compareData(data, dataPath, fileName, refData, additions, checkOnly, exclusions) {
    if (data === null || typeof (data) !== 'object') {
        return data;
    }
    let nextDataPath = (!dataPath ? '' : dataPath + '.');
    for (let key of Object.keys(data)) {
        if (refData[key] !== undefined) {
            if (!isExcluded(key, exclusions)) {
                let nextExclusions = getNextExclusions(key, exclusions);
                data[key] = compareData(data[key], nextDataPath + key, fileName, refData[key], additions, checkOnly, nextExclusions);
            }
        }
        else {
            if (!isExcluded(key, exclusions)) {
                consoleOutput.warn(`Key found in ${fileName} absent in reference file: ${nextDataPath + key}`);
            }
        }
    }
    for (let refKey of Object.keys(refData)) {
        if (data[refKey] === undefined) {
            if (!isExcluded(refKey, exclusions)) {
                if (!checkOnly) {
                    data[refKey] = refData[refKey];
                    additions.push(nextDataPath + refKey);
                }
                else {
                    consoleOutput.warn(`Key found in reference file absent in ${fileName}: ${nextDataPath + refKey}`);
                }
            }
        }
    }
    return data;
}
function isExcluded(key, exclusions) {
    for (let subArray of exclusions) {
        if (subArray[0] === key && subArray.length === 1) {
            return true;
        }
    }
    return false;
}
function getNextExclusions(key, exclusionsArg) {
    let exclusions = [...exclusionsArg];
    for (let i = exclusions.length - 1; i >= 0; i--) {
        if (exclusions[i][0] === key) {
            let nextExclusions = exclusions[i].slice(1);
            if (nextExclusions.length === 0) {
                exclusions.splice(i, 1);
            }
            else {
                exclusions[i] = nextExclusions;
            }
        }
        else {
            exclusions.splice(i, 1);
        }
    }
    return exclusions;
}
async function processFiles(refLocale, pathArg, checkOnly, keepOrderDepth, exclusions) {
    const files = await readDir(pathArg);
    if (!files.some(fileName => fileName === `${refLocale}.json`)) {
        consoleOutput.error(`No file found for the reference locale "${refLocale}"`);
        process.exit(1);
    }
    let filePath = path.join(pathArg, `${refLocale}.json`);
    let refData = JSON.parse(await readFile(filePath));
    refData = orderKeysRecursive(refData, keepOrderDepth);
    if (!checkOnly) {
        await writeFile(filePath, refData);
    }
    for (let fileName of files) {
        if (fileName !== `${refLocale}.json`) {
            filePath = path.join(pathArg, fileName);
            const fileContent = await readFile(filePath);
            let data;
            try {
                data = JSON.parse(fileContent);
            }
            catch (err) {
                consoleOutput.error(`JSON syntax error in file: ${path.resolve(filePath)}`);
                process.exit(1);
            }
            let additions = new Array();
            data = compareData(data, '', fileName, refData, additions, checkOnly, exclusions);
            if (!checkOnly) {
                data = orderKeysRecursive(data, keepOrderDepth);
                await writeFile(filePath, data);
            }
            if (additions.length > 0) {
                consoleOutput.log(`New keys added to ${fileName}:`);
                consoleOutput.logIndented(additions);
            }
        }
    }
}
// --- Main ---
try {
    const refLocale = process.argv[2];
    const pathArg = process.argv[3];
    const optionnalArgs = process.argv.slice(4);
    let checkOnly = false;
    let keepOrderDepth = 0;
    let exclusions = new Array();
    let argIndex;
    if (optionnalArgs.indexOf('--check-only') >= 0) {
        checkOnly = true;
    }
    if ((argIndex = optionnalArgs.indexOf('--keep-order-depth')) >= 0) {
        const valueStr = optionnalArgs[argIndex + 1];
        let value;
        if (valueStr === undefined || isNaN(value = parseInt(valueStr))) {
            consoleOutput.error("Invalid arguments");
            process.exit(1);
        }
        keepOrderDepth = value;
    }
    if ((argIndex = optionnalArgs.indexOf('--exclusions')) >= 0) {
        try {
            const valueStr = optionnalArgs[argIndex + 1];
            if (valueStr === undefined) {
                throw '';
            }
            exclusions = valueStr.split(/\s*,\s*/).map(e => e.split('.'));
        }
        catch (_a) {
            consoleOutput.error("Invalid arguments");
            process.exit(1);
        }
    }
    await processFiles(refLocale, pathArg, checkOnly, keepOrderDepth, exclusions);
}
catch (err) {
    consoleOutput.error(err);
    process.exit(1);
}
