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
  variable_name = "ACA_URL"
  value         = module.container_app.latest_revision_fqdn
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