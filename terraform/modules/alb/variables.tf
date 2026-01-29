variable "name" {}
variable "subnets" {}
variable "vpc_id" {}
variable "internal" {
	description = "Whether the ALB is internal"
	type        = bool
	default     = false
}
