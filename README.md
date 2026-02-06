# 605 - Valentine's Week Website

A cute, interactive Valentine's Week website built with **Vite** and **Vanilla JavaScript**.

## Features

-   **Secure Login**: Sleek glassmorphism UI requiring password `0605`.
-   **Custom Captcha**: "Select Roses" challenge with random shuffling.
-   **Interactive Dashboard**:
    -   **Syncs with IST**: Content changes automatically based on the current date (Feb 7 - Feb 14).
    -   **Interactive Flows**:
        -   **Rose Day**: Get a digital rose 🌹.
        -   **Propose/Valentine's Day**: The "No" button runs away from your cursor! 🏃
        -   **Chocolate/Teddy/Hug/Kiss Day**: "Yes" button runs away (playful teasing), "No" gives you the gift! 🎁
-   **Asset Integration**: Custom cute GIFs and backgrounds.

## Prerequisites

-   **Node.js**: Version 18+ (tested on v18.19.1).
-   **npm**: Comes with Node.js.

## How to Run

1.  **Install Dependencies** (First time only):
    ```bash
    npm install
    ```

2.  **Start the Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    After running the command, you will see a URL in the terminal (usually `http://localhost:5173`). Ctrl+Click it to open.

## How It Works

-   **`index.html`**: The structure of the app, containing the Login, Captcha, and Dashboard views.
-   **`style.css`**: Handles all the pretty visuals, glassmorphism effects, and responsive design.
-   **`main.js`**: The brain of the operation.
    -   Handles Login & Captcha verification.
    -   Calculates the current date in **Indian Standard Time (IST)**.
    -   Loads the specific message and interaction logic for that day from `message.txt` and `valentinesweek.txt`.
    -   Manages the "Run Away" button logic for the interactive fun.
-   **Assets**: All images and GIFs are loaded dynamically from `src/` and `src/loading/`.

## Manual Testing (If today is not yet Valentine's Week)

You can verify the dashboard logic by manually setting the date in `main.js` (around line 160) or simpler: change your system date to Feb 7-14 to see the specific days in action!

## Credits

Created with ♥ by Gopal.
