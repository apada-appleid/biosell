# Docker Deployment Information

## Removed Files

The following files were removed as they're unnecessary for Docker deployment:

1. `deploy.sh` - The script was used for traditional deployment with PM2, but Docker handles deployment differently.
2. `ecosystem.config.js` - PM2 configuration is not needed when using Docker for containerization.

## Deployment Process

For Docker-based deployment, the workflow is now simplified:

```bash
# Pull the latest code
git pull

# Build and run containers
docker-compose build
docker-compose up -d
```

## Configuration Files

The key files for Docker deployment are:

1. `Dockerfile` - Contains the instructions for building the application container
2. `docker-compose.yaml` - Defines the services, networks, and volumes
3. `.env.production` - Contains environment variables for the production environment
4. `next.config.mjs` - Configured with `output: 'standalone'` for optimized Docker builds

## Domain Configuration

The production domain is configured in several places:

- `.env.production` - `NEXTAUTH_URL` and `NEXT_PUBLIC_API_URL` set to "https://biosell.me"
- `next.config.mjs` - Image configuration includes "biosell.me" in remotePatterns

## Deployment Guide

An updated `DEPLOYMENT-GUIDE.md` has been provided that focuses on Docker-based deployment instead of the original PM2-based approach.

## Next Steps

1. Review the `DEPLOYMENT-GUIDE.md` for detailed Docker deployment instructions
2. Ensure all environment variables in `.env.production` are correctly set
3. Consider adding a CI/CD pipeline that builds and deploys Docker images

The `.cursorrules` file has been supplemented with a new file `CURSOR-RULES-UPDATED.md` that includes Docker deployment information, as the original file could not be modified. 