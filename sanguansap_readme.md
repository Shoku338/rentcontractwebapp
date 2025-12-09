# Sanguansap Mansion Management System

A lightweight apartment management tool built with Next.js and Supabase to streamline operations for small to medium-sized apartment buildings.

## 📜 Description

Sanguansap Mansion Management System is designed to simplify apartment management. The system allows administrators to log in, check room availability, and manage monthly electricity meter readings. Built with Next.js for the frontend and Supabase for the backend, it offers a simple, responsive interface with real-time database updates.

## ✨ Features

- **User Authentication**: Secure login system for administrators.
- **Room Management**: View and manage room availability in real-time.
- **Electricity Meter Tracking**: Record and monitor monthly electricity usage per room.
- **Admin Dashboard**: Provides an overview of apartment occupancy and electricity stats.
- **Billing** : Checking the billing and payment of the contracted tenants

## 🛠️ Tech Stack

- **Frontend**: Next.js
- **Backend**: Supabase
- **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js version 18 or later
- npm version 9 or later (comes with Node.js)
- A modern web browser (Chrome, Edge, or Firefox)
- A Supabase account and a new project.

### Installation

1.  Clone the repository to your local machine:
    ```bash
    git clone <your-repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd sanguansap-mansion
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```
4.  Create a `.env.local` file in the root of your project and add your Supabase credentials:
    ```
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
    ```

### Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to `http://localhost:3000`.

## 💡 Usage

Once the application is running, you can use the following demo credentials to log in:

-   **Email**: `veve@gmail.com`
-   **Password**: `111111111`

After logging in, you can explore features like viewing available rooms and managing electricity meter readings.

## 🆘 Help

-   Ensure `.env.local` is correctly set up with your Supabase keys.
-   If the project fails to start, try running `npm install` again before `npm run dev`.
-   Check the browser's developer console for any frontend errors.
-   Supabase authentication issues may require re-checking your API keys or project URL in the Supabase dashboard.

## ✍️ Authors

-   Suvijak Vanichviroon(65360501807)
-   Chirayu Bencharit (65360501803)
