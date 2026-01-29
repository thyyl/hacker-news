resource "aws_ecs_cluster" "this" {
  name = "echo"
}


resource "aws_security_group" "this" {
  name   = "ecs-sg"
  vpc_id = var.vpc_id
}

resource "aws_ecs_task_definition" "this" {
  family                   = "echo"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512


  container_definitions = jsonencode([
    {
      name         = "echo"
      image        = "k8s.gcr.io/e2e-test-images/echoserver:2.5"
      portMappings = [{ containerPort = 80 }]
    }
  ])
}
