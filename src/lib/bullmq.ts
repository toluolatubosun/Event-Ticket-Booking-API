import { Queue } from "bullmq";

import { redis } from "@/lib/redis";
import { CONFIGS } from "@/configs";

const eventQueue = new Queue(CONFIGS.BULL_MQ.EVENT_QUEUE_NAME, { connection: redis });

export { eventQueue };
