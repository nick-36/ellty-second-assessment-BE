"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const tree_1 = __importDefault(require("./routes/tree"));
const cors_1 = __importDefault(require("cors"));
const PORT = process.env.PORT || 8080;
const app = (0, express_1.default)();
const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL_PROD,
].filter((origin) => origin !== undefined);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
    credentials: true,
    maxAge: 86400,
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_1.default);
app.use("/api/trees", tree_1.default);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        // Process handlers
        process.on("unhandledRejection", (err) => __awaiter(void 0, void 0, void 0, function* () {
            console.log("UNHANDLED REJECTION! 💥 Shutting down...");
            console.log(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        }));
        process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
            console.log("SIGTERM received. Closing connections...");
            server.close(() => {
                console.log("💥 Process terminated!");
                process.exit(0);
            });
        }));
        process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
            console.log("👋 SIGINT RECEIVED. Shutting down gracefully");
            server.close(() => {
                console.log("💥 Process terminated!");
                process.exit(0);
            });
        }));
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
});
process.on("uncaughtException", (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    process.exit(1);
}));
app.get("/", (req, res) => {
    res.status(200).send("Welcome to the API!");
});
app.all("*", (req, res, next) => {
    throw new Error(`Can't find ${req.originalUrl} on this server!`);
});
startServer().catch((error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("Failed to start application:", error);
    process.exit(1);
}));
exports.default = app;
