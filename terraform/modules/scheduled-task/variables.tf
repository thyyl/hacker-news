variable "name" {
  description = "Name of the scheduled task"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnets" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "cluster_arn" {
  description = "ECS cluster ARN"
  type        = string
}

variable "container_definitions" {
  description = "Container definitions JSON"
  type        = string
}

variable "cpu" {
  description = "Task CPU units"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Task memory in MB"
  type        = string
  default     = "512"
}

variable "schedule_expression" {
  description = "CloudWatch Events schedule expression"
  type        = string
}

variable "schedule_description" {
  description = "Description of the schedule"
  type        = string
  default     = ""
}

variable "assign_public_ip" {
  description = "Assign public IP to task"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs the task needs access to"
  type        = list(string)
  default     = []
}

variable "task_policy" {
  description = "Custom IAM policy for the task role"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
