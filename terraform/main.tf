################################
# VPCs
################################

module "internet_vpc" {
  source = "./modules/vpc"
  name   = "internet"
  cidr   = "10.0.0.0/16"
}

module "workload_vpc" {
  source = "./modules/vpc"
  name   = "workload"
  cidr   = "10.1.0.0/16"
}


################################
# Transit Gateway
################################

resource "aws_ec2_transit_gateway" "this" {
  description = "main-tgw"
}

resource "aws_ec2_transit_gateway_vpc_attachment" "internet" {
  subnet_ids         = distinct(module.internet_vpc.private_subnets)
  transit_gateway_id = aws_ec2_transit_gateway.this.id
  vpc_id             = module.internet_vpc.vpc_id
}

resource "aws_ec2_transit_gateway_vpc_attachment" "workload" {
  subnet_ids         = distinct(module.workload_vpc.private_subnets)
  transit_gateway_id = aws_ec2_transit_gateway.this.id
  vpc_id             = module.workload_vpc.vpc_id
}

################################
# Internet Ingress Layer
################################

module "internet_alb" {
  source   = "./modules/alb"
  name     = "internet-alb"
  subnets  = module.internet_vpc.public_subnets
  vpc_id   = module.internet_vpc.vpc_id
  internal = false
}

module "internet_nlb" {
  source  = "./modules/nlb"
  name    = "internet-nlb"
  subnets = module.internet_vpc.public_subnets
  vpc_id  = module.internet_vpc.vpc_id

  internal      = false
  protocol      = "TCP"
  listener_port = 80
  target_port   = 80
  target_type   = "ip"
}


################################
# Workload Ingress Layer
################################

module "workload_alb" {
  source   = "./modules/alb"
  name     = "workload-alb"
  subnets  = module.workload_vpc.private_subnets
  vpc_id   = module.workload_vpc.vpc_id
  internal = true
}


################################
# ECS Cluster + Service
################################

module "ecs" {
  source = "./modules/ecs"

  vpc_id  = module.workload_vpc.vpc_id
  subnets = module.workload_vpc.private_subnets

  alb_tg = module.workload_alb.target_group_arn
}


################################
# Aurora
################################

module "aurora" {
  source = "./modules/aurora"

  cluster_identifier = "hackernews-db"
  engine             = "aurora-postgresql"
  engine_version     = "15.4"
  database_name      = "hackernews"
  master_username    = "admin"
  master_password    = var.db_password

  vpc_id     = module.workload_vpc.vpc_id
  subnet_ids = module.workload_vpc.private_subnets

  instance_class = "db.t4g.medium"
  instance_count = 1

  allowed_security_groups = [module.ecs.security_group_id]

  tags = {
    Environment = "production"
    Application = "hackernews"
  }
}


################################
# Secrets
################################

resource "aws_secretsmanager_secret" "db_password" {
  name = "hackernews-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id

  secret_string = jsonencode({
    password = var.db_password
  })
}


################################
# Scheduled ECS Task (Fetcher)
################################

module "hackernews_fetcher" {
  source = "./modules/scheduled-task"

  name        = "hackernews-fetcher"
  vpc_id      = module.workload_vpc.vpc_id
  subnets     = module.workload_vpc.private_subnets
  cluster_arn = module.ecs.cluster_arn

  cpu    = "512"
  memory = "1024"

  schedule_expression  = "cron(0 21 * * ? *)"
  schedule_description = "Fetch Hacker News stories daily at 5am GMT+8"

  secrets_arns = [aws_secretsmanager_secret.db_password.arn]

  container_definitions = jsonencode([{
    name  = "hackernews-fetcher"
    image = "${var.ecr_repository_url}/hackernews-fetcher:latest"

    environment = [
      { name = "DB_HOST", value = module.aurora.cluster_endpoint },
      { name = "DB_PORT", value = tostring(module.aurora.port) },
      { name = "DB_NAME", value = module.aurora.database_name },
      { name = "DB_USER", value = "admin" },
      { name = "HACKERNEWS_API_URL", value = "https://hacker-news.firebaseio.com" }
    ]

    secrets = [
      {
        name      = "DB_PASSWORD"
        valueFrom = "${aws_secretsmanager_secret.db_password.arn}:password::"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/hackernews-fetcher"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}


################################
# TGW Routing 
################################

resource "aws_route" "internet_to_workload" {
  route_table_id         = module.internet_vpc.private_route_table_id
  destination_cidr_block = module.workload_vpc.cidr
  transit_gateway_id     = aws_ec2_transit_gateway.this.id

  depends_on = [
    aws_ec2_transit_gateway_vpc_attachment.internet,
    aws_ec2_transit_gateway_vpc_attachment.workload
  ]
}

resource "aws_route" "workload_to_internet" {
  route_table_id         = module.workload_vpc.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.this.id

  depends_on = [
    aws_ec2_transit_gateway_vpc_attachment.internet,
    aws_ec2_transit_gateway_vpc_attachment.workload
  ]
}
