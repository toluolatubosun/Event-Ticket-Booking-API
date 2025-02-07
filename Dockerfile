FROM node:20.11.1-alpine

RUN apk update && \
    apk upgrade && \
    apk add --no-cache git dumb-init

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app

# Copy package.json files to the working directory (./)
COPY yarn.lock ./
COPY package.json ./
# COPY patches ./patches

# allow unsafe-perm to fix permission issues
RUN yarn config set unsafe-perm true

# Install dependencies using yarn
RUN yarn install --frozen-lockfile --no-cache

# Copy the rest of the application code to the working directory
COPY ./ .

# Set production environment
ENV NODE_ENV=production

# Custom build workflows should be added below here
# ==========================================
# - Build TSC
RUN yarn build

# - Run Prisma Setup Command
RUN yarn prisma:setup

# - Copy the public folder to the dist folder
RUN cp -r public dist/public
# ==========================================

# Set port environment variable
ENV PORT=4000

# Expose port 80
EXPOSE 4000

# Start the application
CMD ["dumb-init", "node", "dist/src/index.js"]