data "azurerm_resource_group" "container_rg" {
  name = var.resource_group_name
}

resource "azurerm_container_app_environment" "container_environment" {
  name                = "cae-${var.app_name}"
  location            = data.azurerm_resource_group.container_rg.location
  resource_group_name = data.azurerm_resource_group.container_rg.name

  tags = var.tags

  depends_on = [
    data.azurerm_resource_group.container_rg
  ]
}

// https://github.com/hashicorp/terraform-provider-azurerm/issues/21242
// There's a circular dependency issue regarding creating the container app and assigning the pull role
// based on system assigned identity.
// The container app is only created if it can connect to the container registry
// so it's not an option to use System Assigned Managed Identity, as terraform will only move to the
// role assignment step if the container app is successfully created, and while Azure does actually create it,
// terraform gets stuck because Azure doesn't give a success response as it can't access the acr
// and so terraform can never assign the role that would make it be able to access it.

resource "azurerm_user_assigned_identity" "containerapp" {
  location            = data.azurerm_resource_group.container_rg.location
  name                = "containerappmi"
  resource_group_name = data.azurerm_resource_group.container_rg.name
}

resource "azurerm_role_assignment" "containerapp_acrpull" {
  scope                = var.identity_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.containerapp.principal_id
  depends_on = [
    azurerm_user_assigned_identity.containerapp
  ]
}

# needed so the app can access the connection string using service connector
# https://learn.microsoft.com/en-us/azure/service-connector/how-to-integrate-cosmos-db?tabs=dotnet
# this default role has way more permissions than needed for this purpose, so a custom role might be safer for production
# Microsoft.DocumentDB/databaseAccounts/listConnectionStrings is the important one
resource "azurerm_role_assignment" "containerapp_listConnectionStrings" {
  scope                = var.cosmos_account_identity_id
  role_definition_name = "DocumentDB Account Contributor"
  principal_id         = azurerm_user_assigned_identity.containerapp.principal_id
  depends_on = [
    azurerm_user_assigned_identity.containerapp
  ]
}

resource "azurerm_container_app" "container_app" {
  name = var.app_name

  container_app_environment_id = azurerm_container_app_environment.container_environment.id
  resource_group_name          = data.azurerm_resource_group.container_rg.name
  revision_mode                = "Single"
  max_inactive_revisions       = 20

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  identity {
    type         = "SystemAssigned, UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.containerapp.id]
  }

  registry {
    server   = var.login_server
    identity = azurerm_user_assigned_identity.containerapp.id
  }

  template {
    container {
      name   = var.app_name
      image  = "${var.login_server}/${var.image_name}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "AZURE_COSMOS_LISTCONNECTIONSTRINGURL"
        value = "https://management.azure.com/subscriptions/${var.subscription_id}/resourceGroups/${data.azurerm_resource_group.container_rg.name}/providers/Microsoft.DocumentDB/databaseAccounts/${var.cosmos_account_name}/listConnectionStrings?api-version=2021-04-15"
      }

      env {
        name  = "AZURE_COSMOS_RESOURCEENDPOINT"
        value = "https://${var.cosmos_account_name}.documents.azure.com:443/"
      }

      env {
        name  = "MONGO_DB_NAME"
        value = var.mongodb_db_name
      }

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.aspnetcore_environment
      }

      env {
        name  = "AZURE_COSMOS_SCOPE"
        value = "https://management.azure.com/.default"
      }

      env {
        name  = "AZURE_COSMOS_CLIENTID"
        value = azurerm_user_assigned_identity.containerapp.client_id
      }

      env {
        name  = "OVERRIDE_AzureAd__ClientId"
        value = var.entra_client_id
      }
    }

    min_replicas = 0
    max_replicas = 1
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
    ]
  }

  depends_on = [
    azurerm_container_app_environment.container_environment
  ]
}