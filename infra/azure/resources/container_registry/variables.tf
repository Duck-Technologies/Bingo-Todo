variable "resource_group_name" {
  description = "The name of the resource group in which the resource will be created."
  type        = string
}

variable "tags" {
  description = "A mapping of tags to assign to the resource group."
  type        = map(string)
}

variable "registry_name" {
  description = "The name of the container registry."
  type        = string
}
