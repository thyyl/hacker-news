variable "name" {}

variable "subnets" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}

variable "internal" {
  type    = bool
  default = true
}

variable "protocol" {
  type    = string
  default = "TCP"
}

variable "listener_port" {
  type    = number
  default = 80
}

variable "target_port" {
  type    = number
  default = 80
}

variable "target_type" {
  type    = string
  default = "ip"
}

variable "health_check_port" {
  type    = number
  default = 80
}

variable "health_check_protocol" {
  type    = string
  default = "TCP"
}
