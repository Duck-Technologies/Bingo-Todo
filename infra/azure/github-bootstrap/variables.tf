variable "location" {
  type        = string
  description = "The location/region where the resources will be created. Must be in the short form (e.g. 'uksouth')"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.location))
    error_message = "The location must only contain lowercase letters, numbers, and hyphens"
  }
  validation {
    condition     = length(var.location) <= 20
    error_message = "The location must be 20 characters or less"
  }
}

variable "repository_name" {
  type = string
}

variable "resource_name_location_short" {
  type        = string
  description = "The short name segment for the location"
  default     = ""
  validation {
    condition     = length(var.resource_name_location_short) == 0 || can(regex("^[a-z]+$", var.resource_name_location_short))
    error_message = "The short name segment for the location must only contain lowercase letters"
  }
  validation {
    condition     = length(var.resource_name_location_short) <= 3
    error_message = "The short name segment for the location must be 3 characters or less"
  }
}

variable "resource_name_workload" {
  type        = string
  description = "The name segment for the workload"
  default     = "bingo"
  validation {
    condition     = can(regex("^[a-z0-9]+$", var.resource_name_workload))
    error_message = "The name segment for the workload must only contain lowercase letters and numbers"
  }
  validation {
    condition     = length(var.resource_name_workload) <= 5
    error_message = "The name segment for the workload must be 4 characters or less"
  }
}

variable "resource_name_environment" {
  type        = string
  description = "The name segment for the environment"
  default     = "mgt"
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
    resource_group_state_name    = "rg-$${workload}-state-$${environment}-$${location}-$${sequence}"
    resource_group_identity_name = "rg-$${workload}-identity-$${environment}-$${location}-$${sequence}"
    storage_account_name         = "sto$${workload}$${environment}$${location_short}$${sequence}$${uniqueness}"
    repository_main_name         = "$${repository_name}"
    azure_role_for_terraform     = "Terraform Deployment for $${workload} CI/CD"
  }
}

variable "environments" {
  type = map(object({
    display_order                                = number
    display_name                                 = string
    redirect_urls                                = optional(list(string), [])
    dependent_environment                        = optional(string, "")
    resource_group_create                        = optional(bool, true)
    resource_group_name_template                 = optional(string, "rg-$${workload}-env-$${environment}-$${location}-$${sequence}")
    user_assigned_managed_identity_name_template = optional(string, "uami-$${workload}-$${environment}-$${type}-$${location}-$${sequence}")
  }))
  default = {
    dev = {
      display_order = 1
      display_name  = "Development"
      redirect_urls = ["https://gentle-desert-004159c03-staging.1.azurestaticapps.net/", "https://gentle-desert-004159c03.1.azurestaticapps.net/"]
    }
    # test = {
    #   display_order         = 2
    #   display_name          = "Test"
    #   dependent_environment = "dev"
    # }
    # prod = {
    #   display_order         = 3
    #   display_name          = "Production"
    #   dependent_environment = "test"
    # }
  }
}

variable "personal_access_token" {
  type      = string
  sensitive = true
}

variable "organization_name" {
  type = string
}

variable "contact_email" {
  type      = string
  sensitive = true
}

variable "test_environment" {
  type    = string
  default = "dev" # this should be test if test resources are being deployed
}
