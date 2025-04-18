import { z } from "zod";
import { Request } from "express";

import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";
import CustomError from "@/utilities/custom-error";
import { extractZodError } from "@/utilities/helpful-methods";

class UserService {
    async getCurrentUser({ $currentUser }: Partial<Request>) {
        const { error, data } = z
            .object({
                $currentUser: z.custom<User>()
            })
            .safeParse({ $currentUser });
        if (error) throw new CustomError(extractZodError(error));

        return await prisma.user.findUnique({ where: { id: data.$currentUser.id } });
    }
}

export default new UserService();
