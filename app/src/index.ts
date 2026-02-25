import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./resources";

dotenv.config();

const app = express();
let server: any;

app.use(cors());
app.use(express.json());

app.use("/api", router);

// Start the server only if not in test mode
if (process.env.NODE_ENV !== "test") {
    const port = Number(process.env.PORT) || 5000;
    const host = "0.0.0.0";

    server = app.listen(port, host, () => {
        console.log(`Server running on http://${host}:${port}`);
    });
}

// Function to close the server (useful for Jest tests)
export const stopServer = () => {
    if (server) {
        server.close();
    }
};

export { app, server };  // Export for testing
