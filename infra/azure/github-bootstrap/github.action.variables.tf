resource "github_actions_environment_variable" "azure_client_id" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "AZURE_CLIENT_ID"
  value         = module.user_assigned_managed_identity[each.key].client_id
}

resource "github_actions_environment_variable" "azure_subscription_id" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "AZURE_SUBSCRIPTION_ID"
  value         = data.azurerm_subscription.current.subscription_id
}

resource "github_actions_environment_variable" "azure_tenant_id" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "AZURE_TENANT_ID"
  value         = data.azurerm_client_config.current.tenant_id
}

resource "github_actions_environment_variable" "backend_azure_storage_account_name" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "BACKEND_AZURE_STORAGE_ACCOUNT_NAME"
  value         = module.storage_account.name
}

resource "github_actions_environment_variable" "backend_azure_storage_account_container_name" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "BACKEND_AZURE_STORAGE_ACCOUNT_CONTAINER_NAME"
  value         = each.value.environment
}

resource "github_actions_environment_variable" "additional_variables" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "ADDITIONAL_ENVIRONMENT_VARIABLES"
  value = jsonencode({
    TF_VAR_resource_group_name = module.resource_group_environments[each.value.environment].name,
    TF_VAR_subscription_id     = data.azurerm_subscription.current.subscription_id
    TF_VAR_contact_email       = var.contact_email
    TF_VAR_service_client_id   = module.entra[each.value.environment].service_client_id
    TF_VAR_ui_client_id        = module.entra[each.value.environment].ui_client_id
    TF_VAR_test_client_id      = module.entra[each.value.environment].test_client_id
  })
}

resource "github_actions_environment_secret" "test_runner_secret" {
  repository      = var.repository_name
  environment     = "${var.test_environment}-apply"
  secret_name     = "TEST_AGENT_CLIENT_SECRET"
  plaintext_value = module.entra[var.test_environment].test_client_secret
}

resource "github_actions_environment_variable" "test_client_id" {
  repository    = var.repository_name
  environment   = "${var.test_environment}-apply"
  variable_name = "TEST_CLIENT_ID"
  value         = module.entra[var.test_environment].test_client_id
}

resource "github_actions_environment_variable" "ui_client_id" {
  for_each      = module.entra
  repository    = var.repository_name
  environment   = "${each.key}-apply"
  variable_name = "UI_CLIENT_ID"
  value         = each.value.ui_client_id
}

resource "github_actions_environment_variable" "access_as_user_scope" {
  for_each      = module.entra
  repository    = var.repository_name
  environment   = "${var.test_environment}-apply"
  variable_name = "SERVICE_USER_IMPERSONATION_SCOPE"
  value         = module.entra[var.test_environment].service_user_impersonation_scope
}

resource "github_actions_environment_variable" "default_scope" {
  for_each      = module.entra
  repository    = var.repository_name
  environment   = "${var.test_environment}-apply"
  variable_name = "SERVICE_DEFAULT_SCOPE"
  value         = module.entra[var.test_environment].service_default_scope
}

resource "github_actions_environment_variable" "var_file" {
  for_each      = local.environment_split
  repository    = var.repository_name
  environment   = github_repository_environment.this[each.key].environment
  variable_name = "VAR_FILE_PATH"
  value         = "./config/${each.value.environment}.tfvars"
}
