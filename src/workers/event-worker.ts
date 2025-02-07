import { Worker } from "bullmq";

import { redis } from "@/lib/redis";
import { CONFIGS } from "@/configs";
import WorkerService from "@/services/worker.service";

export const eventWorker = new Worker(
    CONFIGS.BULL_MQ.EVENT_QUEUE_NAME,
    async (job) => {
        const { user_id, event_id, action } = job.data;

        switch (action) {
            case "event.bookings.create": {
                console.log(`:::> Creating booking for user ${user_id} for event ${event_id}`);

                await WorkerService.createEventBooking({ user_id, event_id });

                break;
            }

            case "event.bookings.cancel": {
                console.log(`:::> Cancelling booking for user ${user_id} for event ${event_id}`);

                await WorkerService.cancelEventBooking({ user_id, event_id });

                break;
            }

            default: {
                throw new Error(`Invalid action: ${action}`);
            }
        }
    },
    {
        autorun: false,
        connection: redis,
        concurrency: 1 // Ensures only 1 job runs at a time
    }
);

export async function closeEventWorker() {
    await eventWorker.close();
}

eventWorker.on("completed", (job) => {
    console.log(`🎉 Job ${job.id} completed successfully`);
});

eventWorker.on("failed", (job, err) => {
    console.error(`⚠️ Job ${job && job.id} failed:`, err.message);
});
