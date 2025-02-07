import { Request, Response } from "express";

import response from "@/utilities/response";
import EventService from "@/services/v1/event.service";

class EventController {
    async createEvent(req: Request, res: Response) {
        const result = await EventService.createEvent(req);
        res.status(201).send(response("Event created successfully", result));
    }

    async createEventBooking(req: Request, res: Response) {
        const result = await EventService.createEventBooking(req);
        res.status(200).send(response("Event booking submitted successfully", result));
    }

    async cancelEventBooking(req: Request, res: Response) {
        const result = await EventService.cancelEventBooking(req);
        res.status(200).send(response("Event booking cancellation submitted successfully", result));
    }

    async getEventStatus(req: Request, res: Response) {
        const result = await EventService.getEventStatus(req);
        res.status(200).send(response("Event status retrieved successfully", result));
    }
}

export default new EventController();
