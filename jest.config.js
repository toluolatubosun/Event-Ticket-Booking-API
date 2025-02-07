module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "@/(.*)": "<rootDir>/src/$1"
    },
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.+(ts|tsx|js)"],
    setupFilesAfterEnv: ["<rootDir>/singleton.ts"]
};
