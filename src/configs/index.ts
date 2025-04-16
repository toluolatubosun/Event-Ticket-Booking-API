/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ms from "ms";
import dotenv from "dotenv";
import packageInfo from "../../package.json";

dotenv.config();

// How to use this:
// ============================================================
// This file is used to store all the environment variables and constants used in the application.

// # To add a new variable:
// ============================================================
// - For environment variables & constants that are the same across all environments, add them to the GLOBAL_CONSTANTS object.
// - For environment-specific variables (i.e they change depending on the environemnt), add them to the environment's object in each of the CONFIG_BUILDER object.

// # To add a new environment:
// ============================================================
// 1. Add a new key to the CONFIG_BUILDER object with the environment name.
// 2. Duplicate the development object and replace the values with the new environment's values.

const APP_VERSION = packageInfo.version;
const DEPLOYMENT_ENV = process.env.NODE_ENV || "development";

const GLOBAL_CONSTANTS = {
    // System Constants
    // ============================================================
    APP_NAME: "ticketing-system",

    BCRYPT_SALT_ROUNDS: 10,
    ACCESS_TOKEN_JWT_EXPIRES_IN: ms("1h"),
    REFRESH_TOKEN_JWT_EXPIRES_IN: ms("30d"),

    APP_ROLES: {
        USER: ["USER"]
    },

    BULL_MQ: {
        EVENT_QUEUE_NAME: "event-queue"
    }
};

const CONFIG_BUILDER = {
    test: {
        ...GLOBAL_CONSTANTS,

        CORS_ALLOWED_ORIGINS: ["http://localhost:3000", "http://localhost:5173"],

        JWT_SECRET: "T4u2Rcnne09F.FBr11f0VvERyUiq",

        REDIS_URI: "redis://localhost:6379"

        // e.g
        // API_SERVICE: {
        //     PUBLIC_KEY: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        //     SECRET_KEY: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        // },
    },

    development: {
        ...GLOBAL_CONSTANTS,

        CORS_ALLOWED_ORIGINS: ["http://localhost:3000", "http://localhost:5173"],

        JWT_SECRET: "T4u2Rcnne09F.FBr11f0VvERyUiq",

        REDIS_URI: "redis://localhost:6379"

        // e.g
        // API_SERVICE: {
        //     PUBLIC_KEY: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        //     SECRET_KEY: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        // },
    },

    production: {
        ...GLOBAL_CONSTANTS,

        CORS_ALLOWED_ORIGINS: ["http://example.com", "http://localhost:5173"],

        JWT_SECRET: process.env.JWT_SECRET!,

        REDIS_URI: process.env.REDIS_URI!

        // e.g
        // API_SERVICE: {
        //     PUBLIC_KEY: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        //     SECRET_KEY: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        // },
    }
} as const;

// Check if DEPLOYMENT_ENV is valid
if (!Object.keys(CONFIG_BUILDER).includes(DEPLOYMENT_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${DEPLOYMENT_ENV}`);
}

const CONFIGS = CONFIG_BUILDER[DEPLOYMENT_ENV as keyof typeof CONFIG_BUILDER];

// Uncomment below to check configs set
// console.log("CONFIGS:", CONFIGS);

export { DEPLOYMENT_ENV, APP_VERSION, CONFIGS };
