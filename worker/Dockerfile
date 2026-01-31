FROM node:22-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for tsx)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Run the worker using tsx (TypeScript execute)
CMD ["pnpm", "exec", "tsx", "worker/bootstrap.ts"]
