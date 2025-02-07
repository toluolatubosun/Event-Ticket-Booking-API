# Event Ticket Booking API
This is the API for a event ticket booking system.

The API enables users to sign up and log in. Authenticated users can create events and track their status. When getting tickets, the system ensures thread safety and prevents race conditions by leveraging BullMQ and Redis for efficient queuing and processing.

If tickets for an event are sold out, users are placed on a waiting list. When a ticket becomes available—such as when another user cancels—the system automatically assigns it to the next person in the queue.

Additionally, database migrations are used to manage the schema, ensuring smooth updates and maintenance. And rate limiting is implemented to prevent abuse and ensure fair usage of the system.

[LIVE DEMO](https://ticketing-system-backend.toluolatubosun.com)

## Designing a Concurrent and Scalable Ticketing System

The goal of this ticketing system was to allow users to create tickets and be placed on a waiting list when tickets were unavailable. One of the biggest challenges in building such a system was handling concurrency and race conditions efficiently, ensuring fair ticket allocation while maintaining a smooth user experience. To address these challenges, I implemented **BullMQ** and **Redis** for queuing the ticket creation and cancellation process, along with **database transactions in Prisma** to ensure data consistency.  

A key concern in this type of system is preventing race conditions, which can occur when multiple users attempt to book the same ticket at the same time. To mitigate this, I designed the API to offload ticket processing to a **queue** rather than handling it synchronously within the request. When a user requests a ticket, the API does not immediately modify the database. Instead, it adds the request to a queue and quickly responds to the user, informing them that their booking is being processed. This approach ensures that users are not blocked by long-running operations, improving the responsiveness of the application.  

A **worker** running in the background processes these queued requests sequentially, ensuring that only one ticket booking operation is handled at a time. This prevents multiple users from simultaneously modifying ticket availability in an unsafe manner. To further ensure data integrity, I used **database transactions in Prisma** inside the worker. Each ticket booking request follows a structured process: the system first checks if tickets are available, assigns one to the user if possible, and commits the transaction. If no tickets are available, the user is added to a **waiting list**, ensuring they have a fair chance of receiving a ticket when one becomes available. Transactions ensure atomicity—either the entire booking operation is completed successfully, or it is rolled back, preventing partial updates that could lead to inconsistencies.  

Handling cancellations follows a similar process. When a user cancels their ticket, the system does not immediately modify the database. Instead, the cancellation request is placed in the **BullMQ queue**, allowing the worker to process it sequentially. If a ticket becomes available due to a cancellation, the system automatically assigns it to the next user on the waiting list. This structured approach prevents race conditions where multiple users might attempt to claim the same released ticket.  

By using **BullMQ and Redis** for queuing and **Prisma transactions** for data consistency, I was able to build a ticketing system that is both **concurrent and thread-safe**. This design prevents race conditions, ensures database integrity, and allows the system to scale while providing a seamless user experience. The combination of background processing and transactional database operations ensures that users can book and cancel tickets efficiently, even under high demand.

## Technologies Used
- Node.js
- Express.js
- Prisma
- PostgreSQL
- Redis
- Docker

## Features
- User Authentication
- Event Creation
- Get Tickets
- Cancel Tickets

## Setup Instructions (Development)

1. Clone the repository

```bash
git clone https://github.com/toluolatubosun/ticketting-system-backend.git
```

2. Install dependencies

```bash
yarn install
```

3. Run the Database (PostgreSQL and Redis) via Docker

```bash
docker-compose up -d
```

P.S: Ensure you have Docker installed and running on your machine

4. Copy the `.env.example` file to `.env` and update the values if necessary


5. Run the Database Migrations and Generate Prisma Client

```bash
# Run the migrations
npx prisma migrate dev

# Generate the Prisma Client
npx prisma generate
```

6. Start the server

```bash
yarn dev
```

## Setup Instructions (Production)

To run the application in production, run the `Dockerfile` in the root directory of the project.

```bash
docker build -t ticketing-system-backend .

docker run -p 4000:4000 ticketing-system-backend
```

Ensure the following environment variables are set in your production environment:

```bash
NODE_ENV=production
DATABASE_URL=
REDIS_URI=
JWT_SECRET=
DIRECT_URL=
```

## API Documentation

The API documentation is located in the `api-client-docs` folder. It contains API definitions in the Bruno format which you can import into compatible API clients.

The documentation includes:
- **Auth Endpoints:**  
  Endpoints for registration, login, token refresh, and logout.  
  (See files in `api-client-docs/v1/auth/`)
  
- **Event Endpoints:**  
  Endpoints for creating events, booking events, cancelling event bookings, and retrieving event status.  
  (See files in `api-client-docs/v1/events/`)
  
- **User Endpoints:**  
  Endpoint for retrieving the current user details.  
  (See files in `api-client-docs/v1/users/`)

To use these, import the Bruno files into an API client (e.g., Bruno) and set the environment variables such as `BASE_URL`, `ACCESS_TOKEN`, and `REFRESH_TOKEN` as needed. There are post-scripts in the Bruno files to automatically set the `ACCESS_TOKEN` and `REFRESH_TOKEN` after authentication.

## API Endpoints

- **POST /v1/auth/register**  
  Registers a new user with name, email, and password.

- **POST /v1/auth/login**  
  Authenticates a user and returns access and refresh tokens.

- **POST /v1/auth/refresh-tokens**  
  Refreshes the access token using a refresh token.

- **POST /v1/auth/logout**  
  Logs out the current user by invalidating the refresh token.

- **POST /v1/events/initialize**  
  Creates a new event with details such as title, description, location, start/end times, and ticket count.

- **GET /v1/events/status/:event_id**  
  Retrieves the status of an event including available tickets and waiting list count.

- **POST /v1/events/book**  
  Submits a request to book a ticket for an event.

- **DELETE /v1/events/booking/cancel**  
  Cancels a previously booked event ticket.

- **GET /v1/users/me**  
  Retrieves details of the currently authenticated user.

## Testing

To run the tests, use the following command:

```bash
yarn test
```

The tests include unit test and integration tests for the API endpoints. The tests are written using Jest and Supertest.

Test coverage is also available. To generate the coverage report, run:

```bash
yarn test:coverage
```