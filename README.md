<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Sleep Tracker API

This project is a NestJS-based API for tracking sleep patterns. It allows users to sign up, log in, record sleep entries, and view sleep statistics. Interaction with the API can be done via HTTP requests or through the provided shell scripts.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Using the Shell Scripts](#using-the-shell-scripts)
  - [Important: Authentication First!](#important-authentication-first)
  - [Script Descriptions](#script-descriptions)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Sleep Endpoints](#sleep-endpoints)
- [Running Tests](#running-tests)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (Most recent LTS)
- pnpm (Package manager)
- `curl` (Command-line tool for transferring data with URLs, usually pre-installed on Linux/macOS)
- `jq` (Command-line JSON processor, for pretty-printing JSON output from some scripts)
  - Install on macOS: `brew install jq`
  - Install on Debian/Ubuntu: `sudo apt-get install jq`

## Environment Configuration

The application requires a `SESSION_SECRET` for session management.

1.  Create a `.env` file in the root of the project.
2.  Add the following line to the `.env` file, replacing `your_strong_secret_here` with a strong, random string:
    ```env
    SESSION_SECRET=your_strong_secret_here
    ```
    The `db.sqlite` file will be created automatically by TypeORM when the application starts and interacts with the database if it doesn't already exist.

## Running the Application

```bash
# Development mode (with hot-reloading)
pnpm run start:dev

# Production mode
# First, build the project:
# pnpm run build
# Then, run the compiled application:
# pnpm run start:prod

# Start in debug mode (with hot-reloading)
# pnpm run start:debug
```

The application will typically start on `http://localhost:3000`.

## Using the Shell Scripts

The `scripts` directory contains shell scripts to interact with the API. These scripts use `curl` to make HTTP requests and `jq` to format JSON responses where applicable.

### Important: Authentication First!

Before you can use most of the scripts (e.g., for adding or retrieving sleep data), you **must** first:

1.  **Sign up** for a new user account using `signup.sh`.
2.  **Log in** with that account using `login.sh`.

The `login.sh` script will create a `cookies.txt` file in the project root. This file stores your session cookie and is used by subsequent scripts to authenticate your requests.

**Workflow:**

1.  Ensure the application is running (`pnpm run start:dev`).
2.  Open a terminal in the project root.
3.  Sign up:
    ```bash
    ./scripts/signup.sh
    ```
    Note the `Username` provided in the output.
4.  Log in (replace `<USERNAME_FROM_SIGNUP>` with the actual username):
    ```bash
    ./scripts/login.sh <USERNAME_FROM_SIGNUP>
    ```
    This will create/update `cookies.txt`.
5.  Now you can use other scripts like `add_sleep.sh`, `get_sleeps_for_user.sh`, etc.

### Script Descriptions

All scripts should be run from the project root directory (e.g., `./scripts/script_name.sh`).

---

**`signup.sh`**

- **Purpose:** Registers a new user. The username is generated randomly.
- **Usage:** `./scripts/signup.sh`
- **Output:** Prints curl verbose output, then the generated username and the default password (`SecurePassword123!`).
  ```
  SIGNUP COMPLETE.
  Username for login: testuser_a1b2c3d4
  Password for login: SecurePassword123!
  ```

---

**`login.sh`**

- **Purpose:** Logs in an existing user and saves the session cookie to `cookies.txt`.
- **Usage:** `./scripts/login.sh <username>`
  - `<username>`: The username of the user to log in (e.g., from `signup.sh`).
- **Output:** Prints curl verbose output. If successful, confirms login and displays the content of `cookies.txt`.
  ```
  Login successful for user 'testuser_a1b2c3d4'. Session cookie saved to 'cookies.txt'.
  Contents of cookies.txt:
  # Netscape HTTP Cookie File ...
  ...
  ```

---

**`add_sleep.sh`**

- **Purpose:** Adds a new sleep entry for the currently logged-in user. Sleep start and duration are randomized within predefined ranges.
- **Usage:** `./scripts/add_sleep.sh [YYYY-MM-DD]`
  - `[YYYY-MM-DD]` (optional): The "date of sleep" for the entry. If omitted, defaults to the current date.
- **Requires:** A valid `cookies.txt` file (user must be logged in).
- **Output:** Prints curl verbose output and the JSON response of the created sleep entry.

  ```bash
  # Add sleep for today
  ./scripts/add_sleep.sh

  # Add sleep for a specific date
  ./scripts/add_sleep.sh 2024-01-15
  ```

---

**`get_sleeps_for_user.sh`**

- **Purpose:** Retrieves all sleep entries for the currently logged-in user.
- **Usage:** `./scripts/get_sleeps_for_user.sh`
- **Requires:** A valid `cookies.txt`.
- **Output:** A JSON array of sleep entries, pretty-printed by `jq`.

---

**`get_single_sleep.sh`**

- **Purpose:** Retrieves a specific sleep entry by its ID for the logged-in user.
- **Usage:** `./scripts/get_single_sleep.sh <sleep_entry_id>`
  - `<sleep_entry_id>`: The ID of the sleep entry to fetch (e.g., `1`, `2`).
- **Requires:** A valid `cookies.txt`.
- **Output:** A JSON object of the sleep entry, pretty-printed by `jq`.

---

**`edit_sleep.sh`**

- **Purpose:** Edits an existing sleep entry. **Note:** This script currently uses a hardcoded JSON payload to update the entry. You may need to modify the script (`scripts/edit_sleep.sh`) to change the update values.
- **Usage:** `./scripts/edit_sleep.sh <sleep_entry_id>`
  - `<sleep_entry_id>`: The ID of the sleep entry to edit.
- **Requires:** A valid `cookies.txt`.
- **Output:** Prints curl verbose output and the JSON response of the updated sleep entry.

---

**`delete_sleep.sh`**

- **Purpose:** Deletes a specific sleep entry by its ID for the logged-in user. Asks for confirmation before deleting.
- **Usage:** `./scripts/delete_sleep.sh <sleep_entry_id>`
  - `<sleep_entry_id>`: The ID of the sleep entry to delete.
- **Requires:** A valid `cookies.txt`.
- **Output:** Prints curl verbose output. A `204 No Content` status in the verbose output indicates successful deletion.

---

**`get_weekly_stats.sh`**

- **Purpose:** Retrieves weekly sleep statistics (average duration, sleep/wake times for the last 7 days) for the logged-in user.
- **Usage:** `./scripts/get_weekly_stats.sh`
- **Requires:** A valid `cookies.txt`.
- **Output:** A JSON object containing the weekly sleep statistics, pretty-printed by `jq`.

## API Endpoints

The API base URL is `http://localhost:3000` by default.

### Health Check

- **`GET /`**
  - **Description:** Checks if the application is running.
  - **Authentication:** Not required.
  - **Response (200 OK):**
    ```json
    {
      "message": "running"
    }
    ```

### Authentication Endpoints

Base path: `/auth`

- **`POST /auth/signup`**

  - **Description:** Registers a new user.
  - **Authentication:** Not required.
  - **Request Body (`application/json`):**
    ```json
    {
      "username": "your_username",
      "password": "YourStrongPassword123!"
    }
    ```
    - `username`: string (3-50 characters)
    - `password`: string (12-100 characters, must include lowercase, uppercase, digit, and special character)
  - **Response (201 Created):**
    ```json
    {
      "message": "Signed up successfully!"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: If validation fails (e.g., username taken, password too weak).

- **`POST /auth/login`**

  - **Description:** Logs in an existing user and sets a session cookie (`connect.sid`).
  - **Authentication:** Not required.
  - **Request Body (`application/json`):**
    ```json
    {
      "username": "your_username",
      "password": "YourStrongPassword123!"
    }
    ```
  - **Response (201 Created):**
    ```json
    {
      "message": "Logged in successfully",
      "user": {
        "userId": 1,
        "username": "your_username"
      }
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized`: If credentials are invalid.

- **`GET /auth/profile`**

  - **Description:** Retrieves the profile of the currently authenticated user.
  - **Authentication:** Required (session cookie).
  - **Response (200 OK):**
    ```json
    {
      "userId": 1,
      "username": "your_username"
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized`: If not authenticated.

- **`POST /auth/logout`**
  - **Description:** Logs out the currently authenticated user and clears the session cookie.
  - **Authentication:** Required (session cookie).
  - **Response (200 OK):**
    ```json
    {
      "message": "logged out"
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized`: If not authenticated (though typically logout is called when authenticated).

### Sleep Endpoints

Base path: `/sleep`
**Authentication:** All sleep endpoints require a valid session cookie (user must be logged in).

- **`POST /sleep`**

  - **Description:** Creates a new sleep entry for the authenticated user.
  - **Request Body (`application/json`):** `CreateSleepDto`
    ```json
    {
      "dateOfSleep": "YYYY-MM-DD",
      "sleepTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "wakeUpTime": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```
    - `dateOfSleep`: string (ISO 8601 date, e.g., "2024-01-15")
    - `sleepTime`: string (ISO 8601 datetime string, e.g., "2024-01-15T22:00:00.000Z")
    - `wakeUpTime`: string (ISO 8601 datetime string, must be after `sleepTime`)
  - **Response (201 Created):** `SleepEntry` object
    ```json
    {
      "id": 1,
      "dateOfSleep": "2024-01-15",
      "sleepTime": "2024-01-15T22:00:00.000Z",
      "wakeUpTime": "2024-01-16T06:00:00.000Z",
      "durationInMinutes": 480,
      "userId": 1,
      "createdAt": "2024-01-15T20:30:00.000Z",
      "updatedAt": "2024-01-15T20:30:00.000Z"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: If validation fails (e.g., `wakeUpTime` not after `sleepTime`).
    - `401 Unauthorized`: If not authenticated.

- **`GET /sleep`**

  - **Description:** Retrieves all sleep entries for the authenticated user, ordered by `dateOfSleep` descending.
  - **Response (200 OK):** Array of `SleepEntry` objects.
    ```json
    [
      {
        "id": 2,
        "dateOfSleep": "2024-01-16",
        "sleepTime": "2024-01-16T23:00:00.000Z",
        "wakeUpTime": "2024-01-17T07:00:00.000Z",
        "durationInMinutes": 480,
        "userId": 1,
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": 1,
        "dateOfSleep": "2024-01-15",
        "sleepTime": "2024-01-15T22:00:00.000Z",
        "wakeUpTime": "2024-01-16T06:00:00.000Z",
        "durationInMinutes": 480,
        "userId": 1,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
    ```
  - **Error Responses:**
    - `401 Unauthorized`: If not authenticated.

- **`GET /sleep/:id`**

  - **Description:** Retrieves a specific sleep entry by its ID, belonging to the authenticated user.
  - **Path Parameters:**
    - `id`: number (ID of the sleep entry)
  - **Response (200 OK):** `SleepEntry` object (similar to `POST /sleep` response).
  - **Error Responses:**
    - `401 Unauthorized`: If not authenticated.
    - `404 Not Found`: If sleep entry with the given ID doesn't exist or doesn't belong to the user.

- **`PATCH /sleep/:id`**

  - **Description:** Updates an existing sleep entry by its ID, belonging to the authenticated user.
  - **Path Parameters:**
    - `id`: number (ID of the sleep entry)
  - **Request Body (`application/json`):** `UpdateSleepDto` (all fields optional)
    ```json
    {
      "dateOfSleep": "YYYY-MM-DD",
      "sleepTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "wakeUpTime": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```
  - **Response (200 OK):** Updated `SleepEntry` object.
  - **Error Responses:**
    - `400 Bad Request`: If validation fails (e.g., updated `wakeUpTime` not after `sleepTime`).
    - `401 Unauthorized`: If not authenticated.
    - `404 Not Found`: If sleep entry doesn't exist or doesn't belong to the user.

- **`DELETE /sleep/:id`**

  - **Description:** Deletes a specific sleep entry by its ID, belonging to the authenticated user.
  - **Path Parameters:**
    - `id`: number (ID of the sleep entry)
  - **Response (204 No Content):** Empty response.
  - **Error Responses:**
    - `401 Unauthorized`: If not authenticated.
    - `404 Not Found`: If sleep entry doesn't exist or doesn't belong to the user.

- **`GET /sleep/stats/weekly`**
  - **Description:** Retrieves weekly sleep statistics for the authenticated user (for the last 7 days including today).
  - **Response (200 OK):** `SleepStatsDto`
    ```json
    {
      "averageSleepDurationMinutes": 472, // or null if no entries
      "averageSleepTime": "22:45", // or null
      "averageWakeUpTime": "06:38", // or null
      "startDate": "2024-01-09", // Start date of the 7-day period
      "endDate": "2024-01-15", // End date of the 7-day period (today)
      "totalEntriesConsidered": 5
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized`: If not authenticated.

## Running Tests

```bash
# Unit tests
pnpm run test

# End-to-end (e2e) tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```
