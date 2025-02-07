import JWT from "jsonwebtoken";
import request from "supertest";
import bcryptjs from "bcryptjs";
import { User } from "@prisma/client";
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

describe("User Endpoints", () => {
    const dummyUser: User = {
        id: createId(),
        name: "Test User",
        email: "example@gmail.com",
        password: bcryptjs.hashSync("password", CONFIGS.BCRYPT_SALT_ROUNDS),
        role: "USER" as "USER",
        created_at: new Date(),
        updated_at: new Date()
    };

    const dummyUserJWT = JWT.sign({ id: dummyUser.id }, CONFIGS.JWT_SECRET, { expiresIn: CONFIGS.ACCESS_TOKEN_JWT_EXPIRES_IN / 1000 });

    const dummyUserFailJWT = JWT.sign({ id: createId() }, CONFIGS.JWT_SECRET, { expiresIn: CONFIGS.ACCESS_TOKEN_JWT_EXPIRES_IN / 1000 });

    test("GET /v1/users/me - should get current user", async () => {
        prismaMock.user.findUnique.mockResolvedValue(dummyUser);

        const response = await request(app).get("/v1/users/me").set("Authorization", `Bearer ${dummyUserJWT}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeTruthy();
        expect(response.body.data.id).toBe(dummyUser.id);
    });

    test("GET /v1/users/me - should fail to authenticate the user, not found", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await request(app).get("/v1/users/me").set("Authorization", `Bearer ${dummyUserFailJWT}`);

        expect(response.status).toBe(401);
        expect(response.body.data).toBeNull();
        expect(response.body.message).toBe("-middleware/user-not-found");
    });
});
