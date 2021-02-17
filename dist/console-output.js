const reset = "\x1b[0m";
const bright = "\x1b[1m";
const dim = "\x1b[2m";
const underscore = "\x1b[4m";
const link = "\x1b[5m";
const reverse = "\x1b[7m";
const hidden = "\x1b[8m";
const black = "\x1b[30m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";
const cyan = "\x1b[36m";
const white = "\x1b[37m";
const bgBlack = "\x1b[40m";
const bgRed = "\x1b[41m";
const bgGreen = "\x1b[42m";
const bgYellow = "\x1b[43m";
const bgBlue = "\x1b[44m";
const bgMagenta = "\x1b[45m";
const bgCyan = "\x1b[46m";
const bgWhite = "\x1b[47m";
export const consoleOutput = {
    log(msg) {
        console.log(msg);
    },
    logIndented(...msg) {
        console.group();
        for (let key of msg) {
            console.log(key);
        }
        console.groupEnd();
    },
    warn(msg) {
        console.warn(green + msg + reset);
    },
    error(error) {
        if (typeof (error) === 'string') {
            console.error(red + error + reset);
        }
        else {
            console.error(red);
            console.error(error);
            console.error(reset);
        }
    }
};
