import bcryptjs from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import JWT from "jsonwebtoken";

import { CONFIGS } from "@/configs";
import { prismaMock } from "../../../../singleton";
import AuthService from "@/services/v1/auth.service";

describe("Auth Service", () => {
    const dummyUser = {
        id: createId(),
        name: "Test User",
        email: "example@gmail.com",
        password: bcryptjs.hashSync("password", CONFIGS.BCRYPT_SALT_ROUNDS),
        role: "USER" as "USER",
        created_at: new Date(),
        updated_at: new Date()
    };

    const refreshToken = "dummyRefresh";
    const hashedRefreshToken = bcryptjs.hashSync(refreshToken, CONFIGS.BCRYPT_SALT_ROUNDS);
    const dummyRefreshTokenJWT = JWT.sign({ id: dummyUser.id, refreshToken: refreshToken }, CONFIGS.JWT_SECRET, { expiresIn: CONFIGS.REFRESH_TOKEN_JWT_EXPIRES_IN / 1000 });

    describe("register", () => {
        it("should register a new user", async () => {
            prismaMock.user.create.mockResolvedValue(dummyUser);

            const result = await AuthService.register({
                body: {
                    name: dummyUser.name,
                    email: dummyUser.email,
                    password: "password"
                }
            });

            expect(result.user).toBeDefined();
            expect(result.user.name).toEqual(dummyUser.name);
            expect(result.user.email).toEqual(dummyUser.email);
        });

        it("should throw error if user already exists", async () => {
            prismaMock.user.findUnique.mockResolvedValue(dummyUser);

            await expect(
                AuthService.register({
                    body: {
                        name: dummyUser.name,
                        email: dummyUser.email,
                        password: "password"
                    }
                })
            ).rejects.toThrow("User already exists");
        });
    });

    describe("login", () => {
        it("should login user with correct credentials", async () => {
            prismaMock.user.findUnique.mockResolvedValue(dummyUser);

            const result = await AuthService.login({ body: { email: dummyUser.email, password: "password" } });

            expect(result.user).toBeDefined();
            expect(result.user.name).toEqual(dummyUser.name);
            expect(result.user.email).toEqual(dummyUser.email);
        });

        it("should throw error with incorrect email or password", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(AuthService.login({ body: { email: dummyUser.email, password: "password" } })).rejects.toThrow("Invalid email or password");
        });

        it("should throw error with incorrect email or password", async () => {
            prismaMock.user.findUnique.mockResolvedValue(dummyUser);

            await expect(AuthService.login({ body: { email: dummyUser.email, password: "wrong-password" } })).rejects.toThrow("Invalid email or password");
        });
    });

    describe("refreshTokens", () => {
        it("should refresh tokens successfully", async () => {
            prismaMock.token.findMany.mockResolvedValue([{ id: createId(), user_id: dummyUser.id, token: hashedRefreshToken, type: "REFRESH", created_at: new Date(), updated_at: new Date() }]);
            prismaMock.user.findUnique.mockResolvedValue(dummyUser);
            prismaMock.token.delete.mockResolvedValue({ id: createId(), user_id: dummyUser.id, token: hashedRefreshToken, type: "REFRESH", created_at: new Date(), updated_at: new Date() });

            const result = await AuthService.refreshTokens({ body: { refresh_token: dummyRefreshTokenJWT } });

            expect(result).toHaveProperty("access_token");
            expect(result).toHaveProperty("refresh_token");
        });

        it("should throw error for invalid refresh token", async () => {
            prismaMock.token.findMany.mockResolvedValue([]);

            await expect(AuthService.refreshTokens({ body: { refresh_token: dummyRefreshTokenJWT } })).rejects.toThrow();
        });
    });

    describe("logout", () => {
        it("should logout user successfully", async () => {
            prismaMock.token.findMany.mockResolvedValue([{ id: createId(), user_id: dummyUser.id, token: hashedRefreshToken, type: "REFRESH", created_at: new Date(), updated_at: new Date() }]);
            prismaMock.token.delete.mockResolvedValue({ id: createId(), user_id: dummyUser.id, token: hashedRefreshToken, type: "REFRESH", created_at: new Date(), updated_at: new Date() });

            const result = await AuthService.logout({ body: { refresh_token: dummyRefreshTokenJWT } });

            expect(result).toBe(true);
        });

        it("should throw error on logout with invalid token", async () => {
            prismaMock.token.findMany.mockResolvedValue([]);

            await expect(AuthService.logout({ body: { refresh_token: dummyRefreshTokenJWT } })).rejects.toThrow();
        });
    });

    describe("updatePassword", () => {
        it("should update password successfully", async () => {
            const updatedUser = { ...dummyUser, password: bcryptjs.hashSync("newpassword", CONFIGS.BCRYPT_SALT_ROUNDS) };
            prismaMock.user.update.mockResolvedValue(updatedUser);

            const result = await AuthService.updatePassword({
                body: {
                    current_password: "password",
                    new_password: "newpassword"
                },
                $currentUser: dummyUser
            });

            expect(result.message).toBe("Password updated successfully");
        });

        it("should throw error with incorrect current password", async () => {
            await expect(
                AuthService.updatePassword({
                    body: {
                        current_password: "wrongpassword",
                        new_password: "newpassword"
                    },
                    $currentUser: dummyUser
                })
            ).rejects.toThrow("Current password is incorrect");
        });
    });
});
