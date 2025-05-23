module "user_assigned_managed_identity" {
  source  = "Azure/avm-res-managedidentity-userassignedidentity/azurerm"
  version = "0.3.3"

  for_each            = local.environment_split
  location            = var.location
  name                = each.value.user_assigned_managed_identity_name
  resource_group_name = module.resource_group["identity"].name
}

locals {
  federated_credentials = { for federated_credential in flatten([for env_key, env_value in local.environment_split : [
    for template in env_value.required_templates : {
      composite_key                     = "${env_key}-${template}"
      user_assigned_managed_identity_id = module.user_assigned_managed_identity[env_key].resource_id
      subject                           = "repo:${var.organization_name}/${local.resource_names.repository_main_name}:environment:${env_key}"
    }
  ]]) : federated_credential.composite_key => federated_credential }
}

resource "azurerm_federated_identity_credential" "this" {
  for_each            = local.federated_credentials
  parent_id           = each.value.user_assigned_managed_identity_id
  name                = lower(replace("${var.organization_name}-${each.key}", ".", "-"))
  resource_group_name = module.resource_group["identity"].name
  audience            = [local.default_audience_name]
  issuer              = local.github_issuer_url
  subject             = each.value.subject
}
