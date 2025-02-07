import { Redis } from "ioredis";
import { CONFIGS, DEPLOYMENT_ENV } from "@/configs";

const redis = new Redis(CONFIGS.REDIS_URI, { maxRetriesPerRequest: null });

redis.on("connect", () => {
    console.info(":::> Connected to redis database.", DEPLOYMENT_ENV === "production" ? "" : CONFIGS.REDIS_URI);
});

redis.on("error", (error) => {
    console.error("<::: Couldn't connect to redis database", error.message);
});

export const closeRedis = () => redis.quit();

export { redis };
