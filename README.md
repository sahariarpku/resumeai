# Firebase Studio

## ResumeForge AI

ResumeForge AI is a Next.js project that helps users create and tailor their resumes using AI. It includes features for managing job descriptions, integrating with RSS feeds, and generating customized cover letters and resumes based on job requirements.

## Technologies Used

Based on the `package.json` file, this project utilizes the following key technologies:

- **Next.js**: React framework for server-side rendering and static site generation.
- **React**: JavaScript library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for rapid styling.
- **TypeScript**: Typed superset of JavaScript that compiles to plain JavaScript.
- **Firebase**: Platform for building web and mobile applications (used for authentication, Firestore database, storage, etc.).
- **GenKit**: Toolkit for building AI applications.
- **Zod**: Schema declaration and validation library.
- **Shadcn/ui**: Reusable UI components built with Tailwind CSS and Radix UI.
- **react-hook-form**: Library for managing form state and validation.
- **react-quill**: Rich text editor component for React.
- **date-fns**: JavaScript date utility library.
- **react-dnd**: Drag and drop library for React.
- **react-resizable-panels**: Resizable panel component for React.

## Project Structure

The project follows a typical Next.js structure with some additions for AI and Firebase integration:

- **`/src/app`**: Contains the Next.js application pages and API routes.
  - **`/(app)`**: Protected routes for the main application.
  - **`/auth`**: Authentication-related pages.
  - **`/api`**: API endpoints.
- **`/src/components`**: Reusable React components.
  - **`/forms`**: Form components and fields.
  - **`/layout`**: Layout components like header and navigation.
  - **`/ui`**: Shadcn/ui components.
- **`/src/lib`**: Utility functions, Firebase initialization, schemas, and types.
- **`/src/hooks`**: Custom React hooks.
- **`/src/contexts`**: React contexts for state management.
- **`/src/ai`**: AI-related code, including GenKit configurations and flows.
  - **`/flows`**: Specific AI workflows (e.g., resume tailoring, job description extraction).
- **`/docs`**: Project documentation.
- **`public`**: Static assets like favicon.
- **`.idx`**: Development environment configuration (likely for Firebase Studio).

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd resumeforge-ai
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Firebase:**
    *   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
    *   Obtain your Firebase project configuration (API key, auth domain, etc.).
    *   Create a `.env.local` file in the root directory and add your Firebase configuration:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
        ```
    *   Ensure your `apphosting.yaml` reflects these environment variables, especially if deploying via Firebase App Hosting.
    *   **Set up Firebase Authentication:** In the Firebase console, go to "Authentication" -> "Sign-in method" and enable the sign-in providers you want to use (e.g., Email/Password, Google, GitHub). For social providers like Google and GitHub, you'll need to configure OAuth consent screens and provide necessary app details.
    *   **Add Authorized Domains for Authentication:** In "Authentication" -> "Sign-in method" -> "Authorized domains", add `localhost` for local development and any domains your app will be hosted on (e.g., your Firebase Hosting domain, Firebase Studio preview domains like `*.cloudworkstations.dev`).
    *   **Set up Firebase Firestore Database (Crucial for Data Persistence):** See the section below.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:9002` (or your configured port).

## Setting Up Firebase Firestore Database

For the application to save user profiles, job descriptions, tailored resumes, and other persistent data, you must set up Cloud Firestore in your Firebase project.

1.  **Navigate to Firestore Database in Firebase Console:**
    *   Go to your Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   In the left-hand navigation menu, under the "Build" category, click on **Firestore Database**.

2.  **Create the Database:**
    *   If you haven't set up Firestore before, you'll see a "Create database" button. Click it.

3.  **Choose Database Mode:**
    *   You will be prompted to select security rules mode. Choose **"Start in production mode"**. This ensures your data is secure by default, and you'll explicitly define access rules. Click **Next**.

4.  **Select Firestore Location:**
    *   Choose a Cloud Firestore location. This is the geographical region where your data will be stored. It's generally recommended to pick a location closest to your users to minimize latency. **This setting cannot be changed later.** Click **Enable**.
    *   It might take a few moments for Firestore to be provisioned.

5.  **Configure Security Rules:**
    *   Once the database is created, you'll be taken to the Firestore "Data" tab. Navigate to the **"Rules"** tab.
    *   The default rules for production mode are very restrictive (typically `allow read, write: if false;`). You need to update these to allow your application to function correctly while maintaining security.
    *   Replace the existing content in the rules editor with the following rules:

        ```javascript
        rules_version = '2';

        service cloud.firestore {
          match /databases/{database}/documents {
            // Users can only read and write their own user document
            // and its subcollections.
            match /users/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;

              // Allow users to read and write their own job descriptions
              match /jobDescriptions/{jdId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }

              // Allow users to read and write their own resumes
              match /resumes/{resumeId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }

              // Add rules for any other subcollections under a user document here
              // For example, if you add a 'settings' subcollection:
              // match /settings/{settingId} {
              //   allow read, write: if request.auth != null && request.auth.uid == userId;
              // }
            }

            // Add rules for other top-level collections if needed.
            // Example: A public 'jobs_board' collection (not currently in use by this app)
            // match /publicJobs/{jobId} {
            //   allow read: if true; // Everyone can read
            //   allow write: if false; // No one can write directly (managed by admin/backend)
            // }
          }
        }
        ```

    *   **Explanation of the rules:**
        *   `request.auth != null`: Ensures the user is authenticated (logged in).
        *   `request.auth.uid == userId`: Ensures that an authenticated user can only access/modify documents under `/users/{theirOwnUserId}`. This is crucial for data privacy.
        *   The rules are structured to cover the `users` collection and specific subcollections (`jobDescriptions`, `resumes`) under each user's document.

6.  **Publish the Rules:**
    *   After pasting the new rules into the editor, click the **"Publish"** button.
    *   It might take a few moments for the new rules to take effect.

With Firestore created and these security rules published, your application should now be able to save and retrieve data persistently and securely in the cloud.

## Genkit AI Setup

This project uses Genkit for AI functionalities.
- Ensure Genkit is installed (it's a dev dependency in `package.json`).
- The AI flows are defined in `/src/ai/flows/`.
- Genkit is initialized in `/src/ai/genkit.ts`.
- To run Genkit flows locally for testing or development (e.g., via the Genkit Developer UI), you can use the command:
  ```bash
  npm run genkit:dev
  # or to watch for changes
  npm run genkit:watch
  ```
  This usually starts a local server (often on port 4000) where you can inspect and run your Genkit flows.

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the Next.js app in development mode with Turbopack.
- `npm run genkit:dev`: Starts the Genkit development server.
- `npm run genkit:watch`: Starts the Genkit development server and watches for file changes.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts a Next.js production server.
- `npm run lint`: Lints the project files.
- `npm run typecheck`: Runs TypeScript type checking.

## Contributing

Contributions are welcome! Please follow standard coding practices and ensure your changes pass linting and type checking.
```