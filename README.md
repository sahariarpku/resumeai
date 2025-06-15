# Firebase Studio

## ResumeForge AI

ResumeForge AI is a Next.js project that helps users create and tailor their resumes using AI. It includes features for managing job descriptions, integrating with RSS feeds, and generating customized cover letters and resumes based on job requirements.

## Technologies Used

Based on the `package.json` file, this project utilizes the following key technologies:

- **Next.js**: React framework for server-side rendering and static site generation.
- **React**: JavaScript library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for rapid styling.
- **TypeScript**: Typed superset of JavaScript that compiles to plain JavaScript.
- **Firebase**: Platform for building web and mobile applications (likely used for authentication, database, storage, etc.).
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

1. **Clone the repository:**
co

