# Hacker News Fetcher (TypeScript)

Automated fetcher for Hacker News stories that runs on a schedule and stores stories in PostgreSQL.

## Features

- Fetches top and new stories from Hacker News API
- Stores stories in PostgreSQL with automatic upsert (updates existing stories)
- Tracks fetch operations with detailed logging
- Handles rate limiting and errors gracefully
- Runs as a scheduled ECS Fargate task
- Written in TypeScript with full type safety

## Configuration

All configuration is done via environment variables:

### Database

- `DB_HOST` - PostgreSQL host (required)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: hackernews)
- `DB_USER` - Database user (default: admin)
- `DB_PASSWORD` - Database password (required, from Secrets Manager)

### API

- `HACKERNEWS_API_URL` - HN API base URL (default: https://hacker-news.firebaseio.com/v0)
- `MAX_STORIES` - Maximum stories to fetch (default: 100)
- `REQUEST_TIMEOUT` - HTTP request timeout in milliseconds (default: 10000)

## Database Schema

### Stories Table

Stores Hacker News stories with the following fields:

- `id` - Auto-increment primary key
- `hn_id` - Hacker News story ID (unique)
- `title` - Story title
- `url` - Story URL (if available)
- `text` - Story text (for Ask HN, etc.)
- `score` - Current score
- `by` - Author username
- `time` - Unix timestamp
- `descendants` - Number of comments
- `story_type` - Type of item (story, job, poll)
- `fetched_at` - When first fetched
- `updated_at` - When last updated

### Fetch Logs Table

Tracks each fetch operation:

- `started_at` - When fetch started
- `completed_at` - When fetch completed
- `stories_fetched` - Total stories fetched
- `stories_new` - New stories added
- `stories_updated` - Existing stories updated
- `success` - Whether operation succeeded
- `errors` - Any errors encountered

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hackernews
export DB_USER=admin
export DB_PASSWORD=yourpassword

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Building Docker Image

```bash
# Build
docker build -t hackernews-fetcher:latest .

# Run locally with Docker
docker run --rm \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=yourpassword \
  hackernews-fetcher:latest
```

## Deployment to AWS

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag hackernews-fetcher:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/hackernews-fetcher:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/hackernews-fetcher:latest

# Deploy infrastructure with Terraform
cd terraform/
terraform init
terraform plan
terraform apply
```

## Monitoring

- Check CloudWatch Logs: `/ecs/hackernews-fetcher`
- Query fetch logs: `SELECT * FROM fetch_logs ORDER BY started_at DESC LIMIT 10;`
- Check latest stories: `SELECT * FROM stories ORDER BY fetched_at DESC LIMIT 20;`

## Type Safety

This application is written in TypeScript with strict type checking enabled. All API responses and database operations are fully typed for compile-time safety.
