variable "resource_group_name" {
  description = "The name of the resource group in which the resource will be created."
  type        = string
}

variable "tags" {
  description = "A mapping of tags to assign to the resource group."
  type        = map(string)
}

variable "app_name" {
  description = "The name of the Azure Container App."
  type        = string
}

variable "login_server" {
  description = "The login server to pull the image from."
  type        = string
}

variable "identity_id" {
  description = "The resource id associated to the container registry."
  type        = string
}

variable "subscription_id" {
  type        = string
  description = "The subscription id in which the resources live."
}

variable "cosmos_account_name" {
  type        = string
  description = "The Cosmos DB account name."
}

variable "cosmos_account_identity_id" {
  description = "The resource id associated to the cosmos account."
  type        = string
}

variable "mongodb_db_name" {
  type        = string
  description = "The Database name."
}

variable "aspnetcore_environment" {
  type = string
}

variable "image_name" {
  description = "Image name"
  type        = string
}

variable "entra_client_id" {
  description = "The Entra Client Id of the API"
  type        = string
}