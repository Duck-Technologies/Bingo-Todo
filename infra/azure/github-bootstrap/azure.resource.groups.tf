resource "azurerm_role_definition" "permissions_for_management" {
  name        = local.resource_names.azure_role_for_terraform
  scope       = "${data.azurerm_subscription.current.id}/resourcegroups/${local.resource_group_names[0]}"
  description = "Containing all permissions that are needed for terraform plan or apply, not included in Reader and/or Contributor."

  permissions {
    actions = [
      "Microsoft.App/containerApps/listSecrets/action",
      "Microsoft.Authorization/roleAssignments/delete",
      "Microsoft.Authorization/roleAssignments/write",
      "Microsoft.Web/staticSites/listSecrets/action",
      "Microsoft.Web/staticSites/listAppSettings/action",
      "Microsoft.DocumentDB/databaseAccounts/listKeys/action",
      "Microsoft.DocumentDB/databaseAccounts/readonlykeys/action",
      "Microsoft.DocumentDB/databaseAccounts/listConnectionStrings/action"
    ]
    not_actions = []
  }

  assignable_scopes = [
    for resource_group_name in local.resource_group_names :
    "${data.azurerm_subscription.current.id}/resourcegroups/${resource_group_name}"
  ]
}

locals {
  resource_groups = merge({
    state = {
      name = local.resource_names.resource_group_state_name
    }
    identity = {
      name = local.resource_names.resource_group_identity_name
    }
  })

  resource_group_names = [
    for env_key, env_value in local.environments : env_value.resource_group_name
  ]

  resource_groups_environments = { for env_key, env_value in local.environments : env_key => {
    name = env_value.resource_group_name
    role_assignments = {
      reader = {
        role_definition_id_or_name = "Reader"
        principal_id               = module.user_assigned_managed_identity["${env_key}-plan"].principal_id
      }
      contributor = {
        role_definition_id_or_name = "Contributor"
        principal_id               = module.user_assigned_managed_identity["${env_key}-apply"].principal_id
      }
      extra_plan = {
        role_definition_id_or_name = azurerm_role_definition.permissions_for_management.name
        principal_id               = module.user_assigned_managed_identity["${env_key}-plan"].principal_id
      }
      extra_apply = {
        role_definition_id_or_name = azurerm_role_definition.permissions_for_management.name
        principal_id               = module.user_assigned_managed_identity["${env_key}-apply"].principal_id
      }
    }
    }
  }
}

module "resource_group" {
  source   = "Azure/avm-res-resources-resourcegroup/azurerm"
  version  = "0.2.1"
  for_each = local.resource_groups
  location = var.location
  name     = each.value.name
}

module "resource_group_environments" {
  source           = "Azure/avm-res-resources-resourcegroup/azurerm"
  version          = "0.2.1"
  for_each         = local.resource_groups_environments
  location         = var.location
  name             = each.value.name
  role_assignments = each.value.role_assignments
}
