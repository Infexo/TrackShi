#  TrackShi

<div align="center">

<div align="center">
  <img src="logo.png" alt="{TrackShi}" width="200"/>

**A powerful study tracker that seamlessly integrates YPT data and fosters collaborative learning through groups.**

[Live Demo](https://trackshi.vercel.app)

</div>

##  Overview

TrackShi is a comprehensive study tracking application designed to help students and learners manage their study sessions, set goals, and categorize their progress. A key feature is its ability to import existing study data from YPT (YouPeeTee) to a unified desktop/web platform, ensuring your data is never lost. TrackShi also empowers collaborative learning by allowing users to join or create study groups with friends, providing a shared environment to achieve academic success. Built with a modern tech stack, it offers a smooth, responsive experience across web and mobile platforms.

##  Features

-   🎯 **Study Session Management**: Track and log your study sessions with ease.
-   🗓️ **Goal Setting**: Define and monitor your academic and personal study goals.
-   🗂️ **Categorization**: Organize study data by custom categories for better insights.
-   🤝 **Group Study**: Create and join study groups with friends for collaborative tracking and motivation.
-   ☁️ **YPT Data Import**: Seamlessly import your existing study data from YouPeeTee (YPT).
-   🔐 **User Authentication**: Secure sign-up, login, and profile management using Supabase Auth.
-   📱 **Cross-Platform Compatibility**: Available as a progressive web app (PWA) and native Android/iOS applications via Capacitor.
-   🎨 **Responsive UI**: A modern and adaptive user interface for optimal viewing on any device.

##  Screenshots

<!-- TODO: Add actual screenshots of the application, including mobile views -->

![Dashboard Screenshot](https://via.placeholder.com/800x450/007bff/ffffff?text=Dashboard+Screenshot)

![Mobile View Screenshot](https://via.placeholder.com/300x550/007bff/ffffff?text=Mobile+View+Screenshot)

##  Tech Stack

**Frontend:**

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![Zustand](https://img.shields.io/badge/Zustand-D00000?style=for-the-badge&logo=zustand&logoColor=white)

![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

**Mobile Framework:**

![Capacitor](https://img.shields.io/badge/Capacitor-1763FF?style=for-the-badge&logo=capacitor&logoColor=white)

**Backend & Database:**

![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**DevOps & Tools:**

![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

##  Quick Start

Follow these steps to get TrackShi up and running on your local machine.

### Prerequisites
-   **Node.js**: `^18.0.0` or higher
-   **npm**: `^9.0.0` or higher (usually comes with Node.js)
-   **Supabase Account**: A free Supabase account for your backend database and authentication.
-   **YPT API Credentials**: Access to YouPeeTee API for data import functionality.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Infexo/TrackShi.git
    cd TrackShi
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment setup**
    Create a `.env` file in the root directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Then, configure your environment variables:
    -   `VITE_APP_URL`: The URL where your application will be hosted (e.g., `http://localhost:5173`).
    -   `VITE_SUPABASE_URL`: Your Supabase Project URL (found in Supabase Dashboard -> Project Settings -> API).
    -   `VITE_SUPABASE_ANON_KEY`: Your Supabase Project `anon` public key.
    -   `VITE_YPT_CLIENT_ID`: Your Client ID for YouPeeTee API.
    -   `VITE_YPT_REDIRECT_URI`: The redirect URI configured for your YPT application (e.g., `http://localhost:5173/auth/callback`).

4.  **Database setup**
    Set up your Supabase project using the provided schema:
    -   Go to your Supabase project dashboard.
    -   Navigate to `SQL Editor`.
    -   Create a new query and paste the contents of `supabase_schema.sql`.
    -   Run the query to set up all necessary tables, RLS policies, and functions.

5.  **Start development server**
    ```bash
    npm run dev
    ```

6.  **Open your browser**
    Visit `http://localhost:5173` (or the port indicated in your terminal).

## Project Structure

```
TrackShi/
├── .env.example       # Example environment variables
├── .gitignore         # Specifies intentionally untracked files to ignore
├── android/           # Capacitor Android project files
├── assets/            # Static assets (e.g., images)
├── capacitor.config.ts# Capacitor configuration for mobile builds
├── generate-assets.ts # Script to generate app icons and splash screens
├── icons/             # Source icons for asset generation
├── index.html         # Main HTML entry point
├── package-lock.json  # Dependency lock file
├── package.json       # Project dependencies and scripts
├── public/            # Static assets served directly
├── src/               # Application source code
│   ├── api/           # API service integrations (e.g., Supabase client)
│   ├── auth/          # Authentication related components/logic
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── layouts/       # Application layout components
│   ├── pages/         # Top-level page components (routes)
│   ├── stores/        # Zustand store definitions (state management)
│   ├── styles/        # Global styles (e.g., Tailwind CSS configuration)
│   ├── utils/         # Utility functions and helpers
│   └── main.tsx       # Main React application entry point
├── supabase_schema.sql# SQL schema for Supabase database
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment configuration
└── vite.config.ts     # Vite build tool configuration
```

##  Configuration

### Environment Variables
TrackShi uses environment variables for sensitive information and configuration.
Create a `.env` file and populate it based on `.env.example`:

| Variable | Description | Default | Required |

|---|---|---|---|

| `VITE_APP_URL` | The public URL of your deployed application. | - | Yes |

| `VITE_SUPABASE_URL` | Your unique Supabase project API URL. | - | Yes |

| `VITE_SUPABASE_ANON_KEY` | Your Supabase project's `anon` (public) API key. | - | Yes |

| `VITE_YPT_CLIENT_ID` | Client ID obtained from your YouPeeTee API application. | - | Yes |

| `VITE_YPT_REDIRECT_URI` | The redirect URI registered with your YouPeeTee API application for OAuth. | - | Yes |

### Configuration Files
-   **`vite.config.ts`**: Configures Vite for bundling, development server, and React integration.
-   **`tsconfig.json`**: TypeScript compiler options.
-   **`capacitor.config.ts`**: Defines Capacitor app ID, name, and web assets directory for mobile builds.
-   **`vercel.json`**: Specifies deployment settings for Vercel, including build command and output directory.

##  Development

### Available Scripts
In the project directory, you can run:

| Command | Description |

|---|---|

| `npm run dev` | Starts the development server at `http://localhost:5173`. |

| `npm run build` | Builds the app for production to the `dist` folder. |

| `npm run preview` | Serves the production build locally for testing. |

| `npm run lint` | Runs ESLint to check for code quality and style issues. |

| `npm run generate-assets` | Executes the TypeScript script to generate app icons and splash screens. |

| `npm run android` | Builds and runs the Android application on a connected device or emulator via Capacitor. |

| `npm run ios` | Builds and runs the iOS application on a connected device or simulator via Capacitor (requires macOS). |

### Development Workflow
-   The application uses **Vite** for a fast development experience with Hot Module Replacement (HMR).
-   **TypeScript** ensures type safety and enhances developer experience.
-   **Tailwind CSS** is used for utility-first styling.
-   **Zustand** is employed for efficient and scalable state management.

##  Testing

While specific test commands were not detected, you would typically integrate a testing framework like Jest or Vitest for a React application.

```bash

# Example: Running unit/integration tests (if configured)

# npm test

# Example: Running end-to-end tests (if configured)

# npm run cypress open
```
<!-- TODO: If actual test files or configs are found, update this section with real commands. -->

##  Deployment

### Production Build
To create an optimized production build:
```bash
npm run build
```
This command compiles the application into the `dist` directory, which can then be deployed to any static hosting provider.

### Deployment Options
-   **Vercel**: This project is configured for seamless deployment to Vercel via `vercel.json`.
    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInfexo%2FTrackShi&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,VITE_YPT_CLIENT_ID,VITE_YPT_REDIRECT_URI,VITE_APP_URL&envDescription=Enter%20your%20Supabase%20and%20YPT%20API%20credentials.&envLink=https%3A%2F%2Fsupabase.com%2Fdocs%2Fguides%2Fplatform%2Fprojects%23project-api-keys)
-   **Capacitor for Mobile**:
    1.  **Add platform**: `npx cap add android` (or `ios`)
    2.  **Sync web assets**: `npx cap sync`
    3.  **Open IDE**: `npx cap open android` (or `ios`)
        From Android Studio/Xcode, you can build and run the native app.

##  API Reference

TrackShi leverages **Supabase** as its backend, providing both a database and authentication services.

### Authentication
User authentication is handled by Supabase Auth, supporting standard email/password authentication. Row Level Security (RLS) is applied to ensure data privacy and security, as defined in `supabase_schema.sql`.

### Database Schema
The `supabase_schema.sql` file outlines the entire database structure, including:
-   `users`: Supabase Auth users.
-   `profiles`: User profiles linked to authentication.
-   `categories`: Custom categories for study sessions.
-   `study_sessions`: Records of individual study periods.
-   `goals`: User-defined study goals.
-   `groups`: Study groups for collaborative learning.
-   `group_members`: Junction table for group members.
-   `group_invites`: For inviting users to groups.
-   `ypt_access_tokens`: Stores access tokens for YouPeeTee API integration.

RLS policies are extensively used on all tables to enforce data access rules based on user roles and ownership.

##  Contributing

We welcome contributions! Please consider opening an issue or submitting a pull request.

### Development Setup for Contributors
1.  Fork the repository.
2.  Clone your forked repository: `git clone https://github.com/YOUR_USERNAME/TrackShi.git`
3.  Follow the [Installation](#installation) steps above to set up the development environment.
4.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`
5.  Make your changes and commit them with descriptive messages.
6.  Push your changes to your fork: `git push origin feature/your-feature-name`
7.  Open a Pull Request to the `main` branch of the original repository.

##  License

This project is not yet licensed. Please refer to the repository owner for licensing information.
<!-- TODO: Add a LICENSE file (e.g., MIT, Apache 2.0) to your repository. -->

##  Acknowledgments

-   **Supabase**: For providing a robust open-source backend solution.
-   **Vercel**: For effortless deployment and hosting.
-   All the fantastic open-source libraries and tools that make this project possible.

##  Support & Contact

-    Issues: [GitHub Issues](https://github.com/Infexo/TrackShi/issues)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [Infexo](https://github.com/Infexo)

</div>

