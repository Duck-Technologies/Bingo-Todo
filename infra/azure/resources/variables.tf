variable "resource_name_workload" {
  type        = string
  description = "The name segment for the workload"
  validation {
    condition     = can(regex("^[a-z0-9]+$", var.resource_name_workload))
    error_message = "The name segment for the workload must only contain lowercase letters and numbers"
  }
  validation {
    condition     = length(var.resource_name_workload) <= 5
    error_message = "The name segment for the workload must be 5 characters or less"
  }
}

variable "resource_name_environment" {
  type        = string
  description = "The name segment for the environment"
  validation {
    condition     = can(regex("^[a-z0-9]+$", var.resource_name_environment))
    error_message = "The name segment for the environment must only contain lowercase letters and numbers"
  }
  validation {
    condition     = length(var.resource_name_environment) <= 4
    error_message = "The name segment for the environment must be 4 characters or less"
  }
}

variable "resource_name_sequence_start" {
  type        = number
  description = "The number to use for the resource names"
  default     = 1
  validation {
    condition     = var.resource_name_sequence_start >= 1 && var.resource_name_sequence_start <= 999
    error_message = "The number must be between 1 and 999"
  }
}

variable "resource_name_templates" {
  type        = map(string)
  description = "A map of resource names to use"
  default = {
    cosmosdb_account_name   = "cdb-$${workload}-$${environment}-$${location}-$${sequence}"
    mongodb_db_name         = "$${workload}-$${environment}"
    container_registry_name = "cr$${workload}$${environment}$${location}"
    container_app_name      = "ca-$${workload}-$${environment}"
    api_management_name     = "duck-technologies"
    api_management_api_name = "apima-$${workload}-$${environment}-$${location}"
    web_app_name            = "swa-$${workload}-$${environment}-$${location}"
  }
}

variable "resource_group_name" {
  description = "The name of the resource group in which the resource will be created."
  type        = string
}

variable "subscription_id" {
  type        = string
  description = "The subscription id in which the resources live"
}

variable "aspnetcore_environment" {
  type    = string
  default = "Production"
}

variable "tags" {
  type = map(string)
}

variable "github_personal_access_token" {
  type      = string
  sensitive = true
}

variable "image_tag" {
  type = string
}

variable "contact_email" {
  type = string
}

variable "service_client_id" {
  type = string
}

variable "ui_client_id" {
  type = string
}

variable "test_client_id" {
  type = string
}