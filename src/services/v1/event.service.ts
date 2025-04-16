import { z } from "zod";
import validator from "validator";
import { Request } from "express";
import { User } from "@prisma/client";

import { CONFIGS } from "@/configs";
import { prisma } from "@/lib/prisma";
import { eventQueue } from "@/lib/bullmq";
import CustomError from "@/utilities/custom-error";
import { extractZodError } from "@/utilities/helpful-methods";

class EventService {
    async createEvent({ body, $currentUser }: Partial<Request>) {
        const { error, data } = z
            .object({
                body: z.object({
                    title: z.string().trim(),
                    location: z.string().trim(),
                    description: z.string().trim(),
                    end_date_time: z
                        .string()
                        .trim()
                        .refine((value) => validator.isISO8601(value), { message: "Invalid date format" }),
                    start_date_time: z
                        .string()
                        .trim()
                        .refine((value) => validator.isISO8601(value), { message: "Invalid date format" }),
                    number_of_tickets: z.number().int().positive()
                }),
                $currentUser: z.custom<User>()
            })
            .safeParse({ body, $currentUser });
        if (error) throw new CustomError(extractZodError(error));

        const event = await prisma.event.create({
            data: {
                title: data.body.title,
                location: data.body.location,
                description: data.body.description,
                end_date_time: data.body.end_date_time,
                start_date_time: data.body.start_date_time,
                total_tickets: data.body.number_of_tickets,
                available_tickets: data.body.number_of_tickets,
                user_id: data.$currentUser.id
            }
        });

        return event;
    }

    async createEventBooking({ body, $currentUser }: Partial<Request>) {
        const { error, data } = z
            .object({
                body: z.object({
                    event_id: z.string().cuid2()
                }),
                $currentUser: z.custom<User>()
            })
            .safeParse({ body, $currentUser });
        if (error) throw new CustomError(extractZodError(error));

        const event = await prisma.event.findUnique({ where: { id: data.body.event_id } });
        if (!event) throw new CustomError("Event not found");

        await eventQueue.add(CONFIGS.BULL_MQ.EVENT_QUEUE_NAME, { user_id: data.$currentUser.id, event_id: event.id, action: "event.bookings.create" });

        const notification = await prisma.notification.create({
            data: {
                user_id: data.$currentUser.id,
                message: `Your booking for event ${event.title} is being processed. You will be notified once processing is complete`
            }
        });

        return { notification };
    }

    async cancelEventBooking({ body, $currentUser }: Partial<Request>) {
        const { error, data } = z
            .object({
                body: z.object({
                    event_id: z.string().cuid2()
                }),
                $currentUser: z.custom<User>()
            })
            .safeParse({ body, $currentUser });
        if (error) throw new CustomError(extractZodError(error));

        const event = await prisma.event.findUnique({ where: { id: data.body.event_id } });
        if (!event) throw new CustomError("Event not found");

        await eventQueue.add(CONFIGS.BULL_MQ.EVENT_QUEUE_NAME, { user_id: data.$currentUser.id, event_id: event.id, action: "event.bookings.cancel" });

        const notification = await prisma.notification.create({
            data: {
                user_id: data.$currentUser.id,
                message: `Your booking for event ${event.title} is being processed. You will be notified once processing is complete`
            }
        });

        return { notification };
    }

    async getEventStatus({ params, $currentUser }: Partial<Request>) {
        const { error, data } = z
            .object({
                params: z.object({
                    event_id: z.string().cuid2()
                }),
                $currentUser: z.custom<User>()
            })
            .safeParse({ params, $currentUser });
        if (error) throw new CustomError(extractZodError(error));

        const event = await prisma.event.findUnique({ where: { id: data.params.event_id } });
        if (!event) throw new CustomError("Event not found");

        const waitingListCount = await prisma.eventTicketWaitingList.count({ where: { event_id: event.id } });

        return { available_tickets: event.available_tickets, waiting_list_count: waitingListCount };
    }

    async getAllMyEvents({ $currentUser }: Partial<Request>) {
        const { error, data } = z
            .object({
                $currentUser: z.custom<User>()
            })
            .safeParse({ $currentUser });
        if (error) throw new CustomError(extractZodError(error));

        const events = await prisma.event.findMany({
            where: { user_id: data.$currentUser.id },
            include: { _count: { select: { event_tickets: true, event_ticket_waiting_list: true } } }
        });

        return events;
    }
}

export default new EventService();
