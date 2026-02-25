"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor(source) {
        this.logDirectory = "logs";
        this.source = source;
        this.ensureLogDirectory();
    }
    getTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, ...args) {
        return `[${this.getTimestamp()}] [${this.source}] [${level.toUpperCase()}]: ${message} ${args.map(arg => JSON.stringify(arg)).join(" ")}`;
    }
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDirectory)) {
            fs_1.default.mkdirSync(this.logDirectory, { recursive: true });
        }
    }
    writeToFile(level, message) {
        const filePath = path_1.default.join(this.logDirectory, `${level}.log`);
        fs_1.default.appendFileSync(filePath, message + "\n", { encoding: "utf8" });
    }
    log(message, ...args) {
        const formatedMessage = this.formatMessage("log", message, args);
        console.log(formatedMessage);
        this.writeToFile("log", formatedMessage);
    }
    info(message, ...args) {
        const formatedMessage = this.formatMessage("info", message, args);
        console.info(formatedMessage);
        this.writeToFile("info", formatedMessage);
    }
    warn(message, ...args) {
        const formatedMessage = this.formatMessage("warn", message, args);
        console.warn(formatedMessage);
        this.writeToFile("warn", formatedMessage);
    }
    error(message, error) {
        const formatedMessage = this.formatMessage("error", message, error.stack);
        console.error(formatedMessage, error);
        this.writeToFile("error", formatedMessage);
    }
}
exports.default = Logger;
