data "azurerm_resource_group" "container_rg" {
  name = var.resource_group_name
}

resource "azurerm_container_app_environment" "container_environment" {
  name                = "cae-${var.app_name}"
  location            = data.azurerm_resource_group.container_rg.location
  resource_group_name = data.azurerm_resource_group.container_rg.name

  tags = var.tags

  depends_on = [
    data.azurerm_resource_group.container_rg,
    azurerm_resource_provider_registration.reg
  ]
}

resource "azurerm_container_app" "container_app" {
  name = var.app_name

  container_app_environment_id = azurerm_container_app_environment.container_environment.id
  resource_group_name          = data.azurerm_resource_group.container_rg.name
  revision_mode                = "Single"

  registry {
    server   = var.login_server
    identity = var.identity_id
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 80

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  identity {
    type = "SystemAssigned"
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
    }

    min_replicas = 0
    max_replicas = 1
  }

  tags = var.tags

  depends_on = [
    azurerm_container_app_environment.container_environment
  ]
}