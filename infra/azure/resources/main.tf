module "cosmos_mongodb" {
  source              = "./cosmos_mongodb"
  resource_group_name = data.azurerm_resource_group.container_rg.name
  tags                = var.tags
  account_name        = local.resource_names.cosmosdb_account_name
  mongodb_name        = local.resource_names.mongodb_db_name
}

module "container_registry" {
  source              = "./container_registry"
  resource_group_name = data.azurerm_resource_group.container_rg.name
  tags                = var.tags
  registry_name       = local.resource_names.container_registry_name
}

module "container_app" {
  source                     = "./container_app"
  resource_group_name        = data.azurerm_resource_group.container_rg.name
  tags                       = var.tags
  app_name                   = local.resource_names.container_app_name
  login_server               = module.container_registry.container_registry_login_server
  identity_id                = module.container_registry.container_registry_id
  cosmos_account_identity_id = module.cosmos_mongodb.cosmos_account_id
  subscription_id            = var.subscription_id
  cosmos_account_name        = local.resource_names.cosmosdb_account_name
  image_name                 = "${var.resource_name_workload}/dotnetapi:${var.image_tag}"
  mongodb_db_name            = local.resource_names.mongodb_db_name
  aspnetcore_environment     = var.aspnetcore_environment
  entra_client_id            = var.service_client_id
}

# https://github.com/hashicorp/terraform-provider-azurerm/issues/27079
# Currently can't create service connection with Terraform for ACA
# resource "azurerm_app_service_connection" "cosmosdb_connector" {
#   name               = "container-app-cosmosdb-connector"
#   app_service_id     = module.container_app.container_app_id
#   target_resource_id = module.cosmos_mongodb.cosmos_account_id
#   client_type        = "dotnet"

#   authentication {
#     type = "systemAssignedIdentity"
#   }
# }

module "static_web_app" {
  source              = "./static_web_app"
  resource_group_name = data.azurerm_resource_group.container_rg.name
  tags                = var.tags
  web_app_name        = local.resource_names.web_app_name
}

module "api_management" {
  source                   = "./api_management"
  resource_group_name      = data.azurerm_resource_group.container_rg.name
  tags                     = var.tags
  container_app_name       = local.resource_names.container_app_name
  publisher_name           = "Duck Technologies"
  publisher_mail           = var.contact_email
  management_name          = local.resource_names.api_management_name
  api_name                 = local.resource_names.api_management_api_name
  api_path                 = "bingo"
  container_app_client_id  = var.service_client_id
  container_app_client_ids = [var.ui_client_id, var.test_client_id]
}

data "github_repository" "repo" {
  full_name = "Duck-Technologies/Bingo-Todo"
}

data "github_repository_environments" "github_environments" {
  repository = data.github_repository.repo.name
}

locals {
  github_envs = {
    for k, v in data.github_repository_environments.github_environments.environments : k => v.name
    if startswith(v.name, var.resource_name_environment)
  }
}

resource "github_actions_environment_variable" "var_cr_name" {
  for_each      = local.github_envs
  repository    = data.github_repository.repo.name
  environment   = each.value
  variable_name = "ACR_NAME"
  value         = local.resource_names.container_registry_name
}

resource "github_actions_environment_variable" "var_ca_url" {
  for_each      = local.github_envs
  repository    = data.github_repository.repo.name
  environment   = each.value
  variable_name = "SERVICE_URL"
  value         = module.api_management.api_url
}

resource "github_actions_environment_variable" "var_ca_name" {
  for_each      = local.github_envs
  repository    = data.github_repository.repo.name
  environment   = each.value
  variable_name = "ACA_NAME"
  value         = local.resource_names.container_app_name
}

resource "github_actions_environment_variable" "var_rg_name" {
  for_each      = local.github_envs
  repository    = data.github_repository.repo.name
  environment   = each.value
  variable_name = "RESOURCE_GROUP_NAME"
  value         = data.azurerm_resource_group.container_rg.name
}

resource "github_actions_environment_secret" "var_webapp_token" {
  for_each        = local.github_envs
  repository      = data.github_repository.repo.name
  environment     = each.value
  secret_name     = "AZURE_STATIC_WEB_APPS_API_TOKEN"
  plaintext_value = module.static_web_app.api_key
}

resource "github_actions_environment_variable" "var_webapp_url" {
  for_each      = local.github_envs
  repository    = data.github_repository.repo.name
  environment   = each.value
  variable_name = "UI_URL"
  value         = module.static_web_app.prod_url
}

resource "github_actions_environment_variable" "var_webapp_staging_url" {
  for_each      = local.github_envs
  repository    = data.github_repository.repo.name
  environment   = each.value
  variable_name = "UI_STAGING_URL"
  value         = module.static_web_app.staging_url
}