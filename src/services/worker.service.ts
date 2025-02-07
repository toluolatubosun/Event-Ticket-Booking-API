import { prisma } from "@/lib/prisma";

class WorkerService {
    async createEventBooking({ user_id, event_id }: { user_id: string; event_id: string }) {
        const result = await prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({ where: { id: event_id } });
            if (!event) throw new Error(`Event with id ${event_id} not found`);

            const user = await tx.user.findUnique({ where: { id: user_id } });
            if (!user) throw new Error(`User with id ${user_id} not found`);

            if (event.available_tickets <= 0) {
                // if no tickets are available

                // add the user to the waiting list
                await tx.eventTicketWaitingList.create({
                    data: {
                        user_id,
                        event_id
                    }
                });

                // notify the user of the waiting list status
                const notification = await tx.notification.create({
                    data: {
                        user_id,
                        message: `There are no available tickets for the event ${event.title}. You have been added to the waiting list.`
                    }
                });

                return { notification, event_ticket: null };
            } else {
                // if tickets are available

                // create a ticket for the user
                const eventTicket = await tx.eventTicket.create({
                    data: {
                        user_id,
                        event_id
                    }
                });

                // update the available tickets count
                await tx.event.update({
                    where: { id: event_id },
                    data: {
                        available_tickets: { decrement: 1 }
                    }
                });

                // notify the user of the successful booking
                const notification = await tx.notification.create({
                    data: {
                        user_id,
                        message: `You have successfully booked a ticket for the event ${event.title}`
                    }
                });

                return { notification, event_ticket: eventTicket };
            }
        });

        return result;
    }

    async cancelEventBooking({ user_id, event_id }: { user_id: string; event_id: string }) {
        const result = await prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({ where: { id: event_id } });
            if (!event) throw new Error(`Event with id ${event_id} not found`);

            const user = await tx.user.findUnique({ where: { id: user_id } });
            if (!user) throw new Error(`User with id ${user_id} not found`);

            const ticket = await tx.eventTicket.findFirst({
                where: {
                    user_id,
                    event_id
                }
            });

            if (!ticket) {
                // if the user does not have a ticket for the event
                // notify the user of the error
                const notification = await tx.notification.create({
                    data: {
                        user_id,
                        message: `You do not have a ticket for the event ${event.title}`
                    }
                });

                return { notification };
            }

            // delete the ticket
            await tx.eventTicket.delete({
                where: { id: ticket.id }
            });

            // notify the user of the successful cancellation
            const notification = await tx.notification.create({
                data: {
                    user_id,
                    message: `You have successfully cancelled your booking for the event ${event.title}`
                }
            });

            // update the available tickets count
            await tx.event.update({
                where: { id: event_id },
                data: {
                    available_tickets: { increment: 1 }
                }
            });

            // check if there are users on the waiting list
            const waitingListEntry = await tx.eventTicketWaitingList.findFirst({
                where: { event_id },
                orderBy: { created_at: "asc" }
            });

            if (waitingListEntry) {
                // if there is a user on the waiting list

                // create a ticket for the user
                await tx.eventTicket.create({
                    data: {
                        event_id,
                        user_id: waitingListEntry.user_id
                    }
                });

                // update the available tickets count
                await tx.event.update({
                    where: { id: event_id },
                    data: {
                        available_tickets: { decrement: 1 }
                    }
                });

                // notify the user of the successful booking
                await tx.notification.create({
                    data: {
                        user_id: waitingListEntry.user_id,
                        message: `You have successfully booked a ticket for the event ${event.title}, based on the waiting list.`
                    }
                });

                // delete the waiting list entry
                await tx.eventTicketWaitingList.delete({
                    where: { id: waitingListEntry.id }
                });
            }

            return { notification };
        });

        return result;
    }
}

export default new WorkerService();
