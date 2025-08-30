import fs from "fs";
import path from "path";

class Logger {
    private readonly source: string;
    private readonly logDirectory: string = "logs";

    constructor(source: string) {
        this.source = source;
        this.ensureLogDirectory();
    }

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private formatMessage(level: string, message: string, ...args: any[]): string {
        return `[${this.getTimestamp()}] [${this.source}] [${level.toUpperCase()}]: ${message} ${args.map(arg => JSON.stringify(arg)).join(" ")}`;
    }

    private ensureLogDirectory() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    private writeToFile(level: string, message: string) {
        const filePath = path.join(this.logDirectory, `${level}.log`);
        fs.appendFileSync(filePath, message + "\n", { encoding: "utf8" });
    }

    log(message: string, ...args: any[]) {
        const formatedMessage = this.formatMessage("log", message, args);
        console.log(formatedMessage);
        this.writeToFile("log", formatedMessage);
    }

    info(message: string, ...args: any[]) {
        const formatedMessage = this.formatMessage("info", message, args);
        console.info(formatedMessage);
        this.writeToFile("info", formatedMessage);
    }

    warn(message: string, ...args: any[]) {
        const formatedMessage = this.formatMessage("warn", message, args);
        console.warn(formatedMessage);
        this.writeToFile("warn", formatedMessage);
    }

    error(message: string, error?: any) {
        const formatedMessage = this.formatMessage("error", message, error.stack);
        console.error(formatedMessage, error);
        this.writeToFile("error", formatedMessage);
    }
}

export default Logger;
