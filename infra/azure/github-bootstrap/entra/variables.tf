variable "personal_access_token" {
  type      = string
  sensitive = true
}

variable "organization_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "app_name" {
  type = string
}

variable "app_display_name" {
  type = string
}

variable "add_test_appreg" {
  type = bool
}

variable "ui_urls" {
  type = list(string)
}