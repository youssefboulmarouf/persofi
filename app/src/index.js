"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = exports.stopServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const resources_1 = __importDefault(require("./resources"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT;
let server;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", resources_1.default);
// Start the server only if not in test mode
if (process.env.NODE_ENV !== "test") {
    exports.server = server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
// Function to close the server (useful for Jest tests)
const stopServer = () => {
    if (server) {
        server.close();
    }
};
exports.stopServer = stopServer;
