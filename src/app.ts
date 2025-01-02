import "dotenv/config";
import express, { Application } from "express";
import userRoutes from "./routes/auth";
import treeRoutes from "./routes/tree";
import cors from "cors";

const PORT = process.env.PORT || 8080;

const app: Application = express();

const allowedOrigins: (string | boolean | RegExp)[] = [
  "http://localhost:3000",
  process.env.FRONTEND_URL_PROD,
].filter((origin): origin is string => origin !== undefined);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
    credentials: true,
    maxAge: 86400,
  })
);
app.options("*", cors());

app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/trees", treeRoutes);

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Process handlers
    process.on("unhandledRejection", async (err: Error) => {
      console.log("UNHANDLED REJECTION! 💥 Shutting down...");
      console.log(err.name, err.message);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Closing connections...");
      server.close(() => {
        console.log("💥 Process terminated!");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("👋 SIGINT RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("💥 Process terminated!");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("uncaughtException", async (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.status(200).send("Welcome to the API!");
});

app.all("*", (req, res, next) => {
  throw new Error(`Can't find ${req.originalUrl} on this server!`);
});

startServer().catch(async (error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

export default app;
