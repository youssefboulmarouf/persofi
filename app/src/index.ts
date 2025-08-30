import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./resources";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
let server: any;

app.use(cors());
app.use(express.json());

app.use("/api", router);

// Start the server only if not in test mode
if (process.env.NODE_ENV !== "test") {
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Function to close the server (useful for Jest tests)
export const stopServer = () => {
    if (server) {
        server.close();
    }
};

export { app, server };  // Export for testing
