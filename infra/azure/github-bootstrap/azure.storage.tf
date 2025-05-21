module "storage_account" {
  source                        = "Azure/avm-res-storage-storageaccount/azurerm"
  version                       = "0.5.0"
  name                          = local.resource_names.storage_account_name
  location                      = var.location
  resource_group_name           = module.resource_group["state"].name
  account_tier                  = "Standard"
  account_replication_type      = "ZRS"
  public_network_access_enabled = true
  network_rules                 = null

  containers = { for env_key, env_value in local.environments : env_key => {
    name          = env_key
    public_access = "None"
    role_assignments = {
      user_assignment_managed_identity-plan = {
        role_definition_id_or_name = "Storage Blob Data Contributor"
        principal_id               = module.user_assigned_managed_identity["${env_key}-plan"].principal_id
      }
      user_assignment_managed_identity-apply = {
        role_definition_id_or_name = "Storage Blob Data Contributor"
        principal_id               = module.user_assigned_managed_identity["${env_key}-apply"].principal_id
      }
    }
    }
  }

  private_endpoints_manage_dns_zone_group = true
  private_endpoints = {}
}
