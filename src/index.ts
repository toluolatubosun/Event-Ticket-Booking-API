// set timezone
process.env.TZ = "Africa/Lagos";

import "express-async-errors";
import { createServer } from "http";
import express, { Express } from "express";

import router from "@/routes";
import { eventWorker } from "@/workers/event-worker";
import { configureErrorMiddleware } from "@/middlewares/error.middleware";
import { configurePreRouteMiddleware } from "@/middlewares/pre-route.middleware";

const app: Express = express();
const httpServer = createServer(app);

// Pre Route Middlewares
configurePreRouteMiddleware(app);

app.use(router);

// Error Handler Middleware
configureErrorMiddleware(app);

const PORT: number | string = process.env.PORT || 4000;

// Listen to server port
httpServer.listen(PORT, async () => {
    console.log(`:::> Server running on PORT: ${PORT}`);

    // Start the event worker
    eventWorker.run();
});

// On server error
app.on("error", (error) => {
    console.error(`<::: An error occurred on the server: \n ${error}`);
});

export { app, httpServer };
