# Assignment

## Given three (3) different security flaws with this design and how you can exploit them?

### Internet ALB Can Reach Deep Into Private Workload

- The internet gateway has direct connectivity to internal components like ALB and NAT within the Internet VPC without proper network segmentation or public/private subnet separation.
- An attacker could potentially bypass the firewall entirely and directly access internal load balancers or the NAT gateway if they're placed in public subnets with public IPs.

### Transit Gateway (TGW) vulnerability

- The Transit Gateway connects both VPCs without apparent network segmentation controls, inspection, or least-privilege routing policies between the networks.
- If an attacker compromises any resource in either VPC (Internet or Workload VPC), they can use the TGW as a pivot point to laterally move between VPCs.

### No Traffic Inspection Between Tiers in Workload VPC

- The workload VPC shows direct connectivity between web→app→data tiers (NLB→ALB→ECS→Aurora) without any security inspection, segmentation controls, or a firewall protecting critical data resources.
- Attack onto the web tier (via application vulnerabilities, stolen credentials, or supply chain attacks) can directly access the ECS application layer and the Aurora database.

## If you used LLM, elaborate on how you use them?

- Understand Terraform usage for IaC
- Understanding infra side of things
- Generating Terraform boilerplates

# Hacker News Fetcher

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
