variable "resource_group_name" {
  description = "The name of the resource group in which the resource will be created."
  type        = string
}

variable "container_app_name" {
  description = "The name of an existing container app in the resource group."
  type        = string
}

variable "container_app_client_id" {
  description = "The Entra Client Id associated to the Container App."
  type        = string
}

variable "container_app_client_ids" {
  description = "The Entra Client Ids authorized to use the Container App."
  type        = list(string)
}

variable "publisher_name" {
  description = "The name of the API publisher."
  type        = string
}

variable "publisher_mail" {
  description = "The email of the API publisher."
  type        = string
}

variable "tags" {
  description = "A mapping of tags to assign to the resource group."
  type        = map(string)
}

variable "management_name" {
  description = "The name of the api management."
  type        = string
}

variable "api_name" {
  description = "The name of the api."
  type        = string
}

variable "api_path" {
  description = "The path of the endpoints."
  type        = string
}

variable "revision" {
  description = "API Revision."
  type        = string
  default     = "1"
}

variable "path_version" {
  description = "Version Path"
  type        = string
  default     = "v1"
}