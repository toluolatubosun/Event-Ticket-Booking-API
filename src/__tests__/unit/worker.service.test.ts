import bcryptjs from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

import { CONFIGS } from "@/configs";
import { prismaMock } from "../../../singleton";
import WorkerService from "@/services/worker.service";

describe("Worker Service", () => {
    const dummyEvent = {
        id: createId(),
        title: "Test Event",
        location: "Test Location",
        description: "Test Description",
        end_date_time: new Date(),
        start_date_time: new Date(),
        total_tickets: 1,
        available_tickets: 1,
        user_id: createId(),
        created_at: new Date(),
        updated_at: new Date()
    };

    const dummyUser = {
        id: createId(),
        name: "Test User",
        email: "example@gmail.com",
        password: bcryptjs.hashSync("password", CONFIGS.BCRYPT_SALT_ROUNDS),
        role: "USER" as "USER",
        created_at: new Date(),
        updated_at: new Date()
    };

    describe("createEventBooking", () => {
        it("should throw error if event not found", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: { findUnique: jest.fn().mockResolvedValue(null) }
                };
                return await cb(tx);
            });

            await expect(
                WorkerService.createEventBooking({
                    user_id: dummyUser.id,
                    event_id: dummyEvent.id
                })
            ).rejects.toThrow(`Event with id ${dummyEvent.id} not found`);
        });

        it("should throw error if user not found", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: { findUnique: jest.fn().mockResolvedValue(dummyEvent) },
                    user: { findUnique: jest.fn().mockResolvedValue(null) }
                };
                return await cb(tx);
            });

            await expect(
                WorkerService.createEventBooking({
                    user_id: dummyUser.id,
                    event_id: dummyEvent.id
                })
            ).rejects.toThrow(`User with id ${dummyUser.id} not found`);
        });

        it("should add user to waiting list if no tickets are available", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: { findUnique: jest.fn().mockResolvedValue({ ...dummyEvent, available_tickets: 0 }) },
                    user: { findUnique: jest.fn().mockResolvedValue(dummyUser) },
                    eventTicketWaitingList: {
                        create: jest.fn().mockResolvedValue({
                            id: createId(),
                            user_id: dummyUser.id,
                            event_id: dummyEvent.id,
                            created_at: new Date(),
                            updated_at: new Date()
                        })
                    },
                    notification: {
                        create: jest.fn().mockResolvedValue({
                            id: createId(),
                            user_id: dummyUser.id,
                            message: `There are no available tickets for the event ${dummyEvent.title}. You have been added to the waiting list.`,
                            created_at: new Date(),
                            updated_at: new Date()
                        })
                    }
                };
                return await cb(tx);
            });

            const result = await WorkerService.createEventBooking({ user_id: dummyUser.id, event_id: dummyEvent.id });

            expect(result.notification).toBeDefined();
            expect(result.notification.message).toBe(`There are no available tickets for the event ${dummyEvent.title}. You have been added to the waiting list.`);
            expect(result.event_ticket).toBeNull();
        });

        it("should create a ticket if tickets are available", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: {
                        findUnique: jest.fn().mockResolvedValue(dummyEvent),
                        update: jest.fn().mockResolvedValue({ ...dummyEvent, available_tickets: dummyEvent.available_tickets - 1 })
                    },
                    user: { findUnique: jest.fn().mockResolvedValue(dummyUser) },
                    eventTicket: {
                        create: jest.fn().mockResolvedValue({
                            id: createId(),
                            user_id: dummyUser.id,
                            event_id: dummyEvent.id,
                            created_at: new Date(),
                            updated_at: new Date()
                        })
                    },
                    notification: {
                        create: jest.fn().mockResolvedValue({
                            id: createId(),
                            user_id: dummyUser.id,
                            message: `You have successfully booked a ticket for the event ${dummyEvent.title}`,
                            created_at: new Date(),
                            updated_at: new Date()
                        })
                    }
                };
                return await cb(tx);
            });

            const result = await WorkerService.createEventBooking({
                user_id: dummyUser.id,
                event_id: dummyEvent.id
            });

            expect(result.notification.message).toBe(`You have successfully booked a ticket for the event ${dummyEvent.title}`);
            expect(result.event_ticket).toBeDefined();
            expect(result.event_ticket?.user_id).toBe(dummyUser.id);
        });
    });

    describe("cancelEventBooking", () => {
        it("should throw error if event not found", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: { findUnique: jest.fn().mockResolvedValue(null) }
                };
                return await cb(tx);
            });

            await expect(
                WorkerService.cancelEventBooking({
                    user_id: dummyUser.id,
                    event_id: dummyEvent.id
                })
            ).rejects.toThrow(`Event with id ${dummyEvent.id} not found`);
        });

        it("should throw error if user not found", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: { findUnique: jest.fn().mockResolvedValue(dummyEvent) },
                    user: { findUnique: jest.fn().mockResolvedValue(null) }
                };
                return await cb(tx);
            });

            await expect(
                WorkerService.cancelEventBooking({
                    user_id: dummyUser.id,
                    event_id: dummyEvent.id
                })
            ).rejects.toThrow(`User with id ${dummyUser.id} not found`);
        });

        it("should send a notification if the user has not booked a ticket", async () => {
            prismaMock.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    event: { findUnique: jest.fn().mockResolvedValue(dummyEvent) },
                    user: { findUnique: jest.fn().mockResolvedValue(dummyUser) },
                    eventTicket: { findFirst: jest.fn().mockResolvedValue(null) },
                    notification: {
                        create: jest.fn().mockResolvedValue({
                            id: createId(),
                            user_id: dummyUser.id,
                            message: `You do not have a ticket for the event ${dummyEvent.title}`,
                            created_at: new Date(),
                            updated_at: new Date()
                        })
                    }
                };
                return await cb(tx);
            });

            const result = await WorkerService.cancelEventBooking({ user_id: dummyUser.id, event_id: dummyEvent.id });

            expect(result.notification).toBeDefined();
            expect(result.notification.message).toBe(`You do not have a ticket for the event ${dummyEvent.title}`);
        });
    });
});
