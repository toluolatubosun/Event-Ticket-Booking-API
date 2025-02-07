import response from "@/utilities/response";
import { Express, NextFunction, Request, Response } from "express";

const configureErrorMiddleware = (app: Express): Express => {
    // Handle 404 requests
    app.use("*", (_req: Request, res: Response) => {
        res.status(404).send(response("Invalid request", null, false));
    });

    // Handle errors middleware
    app.use((error: Error, _req: Request, res: Response, next: NextFunction) => {
        // Handle custom errors
        if (error.name == "CustomError" && (error as any).status) {
            res.status((error as any).status).send(response(error.message, null, false));
        } else if (
            [
                "PrismaClientKnownRequestError",
                "PrismaClientUnknownRequestError",
                "PrismaClientRustPanicError",
                "PrismaClientInitializationError",
                "JsonWebTokenError",
                "ValidationError",
                "SyntaxError"
            ].includes(error.name)
        ) {
            res.status(400).send(response(error.message, null, false));
        } else {
            res.status(500).send(response(error.message, null, false));
        }

        next();
    });

    return app;
};

export { configureErrorMiddleware };
