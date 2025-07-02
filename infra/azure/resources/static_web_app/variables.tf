variable "resource_group_name" {
  description = "The name of the resource group in which the resource will be created."
  type        = string
}

variable "tags" {
  description = "A mapping of tags to assign to the resource group."
  type        = map(string)
}

variable "web_app_name" {
  description = "The name of the web app."
  type        = string
}

variable "repository_url" {
  description = "The URL off the repository"
  type        = string
}

variable "repository_token" {
  type      = string
  sensitive = true
}