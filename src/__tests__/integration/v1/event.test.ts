import JWT from "jsonwebtoken";
import request from "supertest";
import bcryptjs from "bcryptjs";
import { User, Event } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

import { CONFIGS } from "@/configs";
import { closeRedis } from "@/lib/redis";
import { app, httpServer } from "../../../index";
import { prismaMock } from "../../../../singleton";
import { closeEventWorker } from "@/workers/event-worker";

afterAll(async () => {
    await new Promise((resolve, reject) => {
        httpServer.close((err: any) => {
            if (err) {
                return reject(err);
            }
            resolve(true);
        });
    });
    await closeEventWorker();
    await closeRedis();
}, 50000);

describe("Event Endpoints", () => {
    const dummyUser: User = {
        id: createId(),
        name: "Test User",
        email: "example@gmail.com",
        password: bcryptjs.hashSync("password", CONFIGS.BCRYPT_SALT_ROUNDS),
        role: "USER" as "USER",
        created_at: new Date(),
        updated_at: new Date()
    };

    const dummyEvent: Event = {
        id: createId(),
        title: "Test Event",
        location: "Test Location",
        description: "Test Event Description",
        end_date_time: new Date(),
        start_date_time: new Date(),
        user_id: dummyUser.id,
        total_tickets: 100,
        available_tickets: 100,
        updated_at: new Date(),
        created_at: new Date()
    };

    const dummyUserJWT = JWT.sign({ id: dummyUser.id }, CONFIGS.JWT_SECRET, { expiresIn: CONFIGS.ACCESS_TOKEN_JWT_EXPIRES_IN / 1000 });

    test("POST /v1/events/initialize - should create a new event", async () => {
        prismaMock.event.create.mockResolvedValue(dummyEvent);
        prismaMock.user.findUnique.mockResolvedValue(dummyUser);

        const response = await request(app).post("/v1/events/initialize").set("Authorization", `Bearer ${dummyUserJWT}`).send({
            title: dummyEvent.title,
            location: dummyEvent.location,
            description: dummyEvent.description,
            start_date_time: dummyEvent.start_date_time,
            end_date_time: dummyEvent.end_date_time,
            number_of_tickets: dummyEvent.total_tickets
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("id");
        expect(response.body.data.title).toBe(dummyEvent.title);
    });

    test("GET /v1/events/status/:event_id - should get event status", async () => {
        prismaMock.user.findUnique.mockResolvedValue(dummyUser);
        prismaMock.event.findUnique.mockResolvedValue(dummyEvent);
        prismaMock.eventTicketWaitingList.count.mockResolvedValue(10);

        const response = await request(app).get(`/v1/events/status/${dummyEvent.id}`).set("Authorization", `Bearer ${dummyUserJWT}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("available_tickets");
        expect(response.body.data).toHaveProperty("waiting_list_count");
        expect(response.body.data.available_tickets).toBe(dummyEvent.available_tickets);
        expect(response.body.data.waiting_list_count).toBe(10);
    });

    test("POST /v1/events/book - should create event booking", async () => {
        prismaMock.user.findUnique.mockResolvedValue(dummyUser);
        prismaMock.event.findUnique.mockResolvedValue(dummyEvent);
        prismaMock.notification.create.mockResolvedValue({
            id: createId(),
            user_id: dummyUser.id,
            message: `Your booking for event ${dummyEvent.title} is being processed. You will be notified once processing is complete`,
            created_at: new Date(),
            updated_at: new Date()
        });

        const response = await request(app).post("/v1/events/book").set("Authorization", `Bearer ${dummyUserJWT}`).send({
            event_id: dummyEvent.id
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("notification");
    });

    test("DELETE /v1/events/booking/cancel - should cancel event booking", async () => {
        prismaMock.user.findUnique.mockResolvedValue(dummyUser);
        prismaMock.event.findUnique.mockResolvedValue(dummyEvent);
        prismaMock.notification.create.mockResolvedValue({
            id: createId(),
            user_id: dummyUser.id,
            message: `Your booking for event ${dummyEvent.title} is being processed. You will be notified once processing is complete`,
            created_at: new Date(),
            updated_at: new Date()
        });

        const response = await request(app).delete("/v1/events/booking/cancel").set("Authorization", `Bearer ${dummyUserJWT}`).send({
            event_id: dummyEvent.id
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("notification");
    });
});
