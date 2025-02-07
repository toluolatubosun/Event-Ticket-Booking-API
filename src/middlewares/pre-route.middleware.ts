import ms from "ms";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express, { Express } from "express";
import { RedisStore } from "rate-limit-redis";
import { rateLimit } from "express-rate-limit";

import { CONFIGS } from "@/configs";
import { redis } from "@/lib/redis";

const configurePreRouteMiddleware = (app: Express): Express => {
    // enable CORS
    app.use(
        cors({
            credentials: true,
            origin: [...CONFIGS.CORS_ALLOWED_ORIGINS]
        })
    );

    // Rate limiting middleware
    app.use(
        rateLimit({
            limit: 200, // 200 requests
            windowMs: ms("10m"), // 10 minutes
            legacyHeaders: false,
            standardHeaders: "draft-7",
            store: new RedisStore({
                // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
                sendCommand: (...args: string[]) => redis.call(...args)
            })
        })
    );

    // Secure the app by setting various HTTP headers off.
    app.use(helmet({ contentSecurityPolicy: false }));

    // Enable HTTP request logging
    app.use(morgan("common"));

    // Tell express to recognize the incoming Request Object as a JSON Object
    app.use(express.json());

    // Express body parser
    app.use(express.urlencoded({ extended: true }));

    return app;
};

export { configurePreRouteMiddleware };
