output "cluster_id" {
  description = "Cluster ID"
  value       = aws_rds_cluster.this.id
}

output "cluster_endpoint" {
  description = "Writer endpoint"
  value       = aws_rds_cluster.this.endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint"
  value       = aws_rds_cluster.this.reader_endpoint
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.this.id
}

output "port" {
  description = "Database port"
  value       = aws_rds_cluster.this.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.this.database_name
}
