# Deprecation Notice — nexus-runner

`nexus-runner` is officially **deprecated** and is no longer maintained.

## Rationale
The architecture has transitioned from local containerized services (local PostgreSQL in Docker, Redis, MinIO) to cloud-hosted infrastructure powered by **Supabase**. Consequently, running the local Docker-compose stack is no longer required.

## Running the Application
To run the project in development mode:
1. Ensure your `.env.local` contains the working database credentials.
2. Launch the dev server directly from the root directory:
   ```bash
   npm run dev
   ```
