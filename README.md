# Biosell - E-commerce Platform

Biosell is a modern e-commerce platform built with Next.js, allowing sellers to create online shops and customers to purchase products.

## Features

- **Multi-user System**: Admin, Seller, and Customer roles
- **Product Management**: Create, update, and delete products with images
- **Order Management**: Track and manage orders
- **Subscription Plans**: Different plans for sellers
- **Authentication**: Secure login with credentials and OTP verification
- **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- MySQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/biosell-front.git
   cd biosell-front
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/biosell"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. Generate Prisma client:
   ```bash
   yarn db:generate
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Seed the database (optional):
   ```bash
   yarn seed
   ```

7. Start the development server:
   ```bash
   yarn dev
   ```

## Production Deployment

### Option 1: Vercel (Recommended)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy

### Option 2: Self-hosted

1. Build the application:
   ```bash
   yarn build
   ```

2. Start the production server:
   ```bash
   yarn start
   ```

### Option 3: Docker

1. Build the Docker image:
   ```bash
   docker build -t biosell-front .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -e DATABASE_URL=your-db-url -e NEXTAUTH_URL=your-url -e NEXTAUTH_SECRET=your-secret biosell-front
   ```

Alternatively, use docker-compose:
```bash
docker-compose up -d
```

## Project Structure

- `/app`: Main application code (Next.js App Router)
  - `/api`: API routes
  - `/components`: Reusable UI components
  - `/hooks`: Custom React hooks
  - `/store`: Zustand state management
- `/lib`: Utility functions and configurations
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/types`: TypeScript type definitions

## Authentication

The application uses NextAuth.js with a credential provider for authentication. There are three user types:

1. **Admin**: Can manage sellers, products, and subscriptions
2. **Seller**: Can manage their shop, products, and orders
3. **Customer**: Can browse products, place orders, and manage their profile

## API Structure

The API follows RESTful principles and is organized by domain:

- `/api/admin/*`: Admin-specific endpoints
- `/api/seller/*`: Seller-specific endpoints
- `/api/customer/*`: Customer-specific endpoints
- `/api/shop/*`: Public shop endpoints
- `/api/auth/*`: Authentication endpoints

## Maintenance

### Database Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name your-migration-name
```

### Updating Dependencies

```bash
yarn upgrade-interactive --latest
```

## Troubleshooting

- **Database Connection Issues**: Verify your DATABASE_URL is correct and the database server is running
- **Authentication Problems**: Check NEXTAUTH_URL and NEXTAUTH_SECRET environment variables
- **Build Errors**: Make sure all dependencies are installed and compatible

## License

This project is licensed under the MIT License - see the LICENSE file for details.
