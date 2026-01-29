output "task_definition_arn" {
  description = "Task definition ARN"
  value       = aws_ecs_task_definition.this.arn
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.this.id
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.this.name
}

output "schedule_rule_arn" {
  description = "CloudWatch Events rule ARN"
  value       = aws_cloudwatch_event_rule.this.arn
}
