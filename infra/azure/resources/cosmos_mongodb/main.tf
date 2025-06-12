data "azurerm_resource_group" "container_rg" {
  name = var.resource_group_name
}

resource "azurerm_cosmosdb_account" "cosmosdb_account" {
  name                          = var.account_name
  location                      = data.azurerm_resource_group.container_rg.location
  resource_group_name           = data.azurerm_resource_group.container_rg.name
  offer_type                    = "Standard"
  kind                          = "MongoDB"
  automatic_failover_enabled    = false
  free_tier_enabled             = true
  local_authentication_disabled = true // this doesn't apply to MongoDB as of now, but keeping it true anyway
  mongo_server_version          = "7.0"

  public_network_access_enabled = true
  # Azure portal and Azure resources
  ip_range_filter = ["0.0.0.0", "4.210.172.107", "13.88.56.148", "13.91.105.215", "13.95.130.121", "20.245.81.54", "40.80.152.199", "40.91.218.243", "40.118.23.126"]

  capabilities {
    name = "EnableMongo"
  }

  capabilities {
    name = "EnableMongoRoleBasedAccessControl"
  }

  geo_location {
    location          = data.azurerm_resource_group.container_rg.location
    failover_priority = 0
  }

  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 10
    max_staleness_prefix    = 200
  }
  tags = var.tags
  depends_on = [
    data.azurerm_resource_group.container_rg
  ]
}

resource "azurerm_cosmosdb_mongo_database" "mongodb" {
  name                = var.mongodb_name
  resource_group_name = azurerm_cosmosdb_account.cosmosdb_account.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
  throughput          = var.throughput
  depends_on = [
    azurerm_cosmosdb_account.cosmosdb_account
  ]
}

# resource "azurerm_cosmosdb_mongo_collection" "coll" {
#   name                = "cosmosmongodbcollection"
#   resource_group_name = azurerm_cosmosdb_account.cosmosdb_account.resource_group_name
#   account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
#   database_name       = azurerm_cosmosdb_mongo_database.mongodb.name

#   default_ttl_seconds = "777"
#   shard_key           = "uniqueKey"
#   throughput          = var.throughput

#   lifecycle {
#     ignore_changes = [index]
#   }

#   depends_on = [azurerm_cosmosdb_mongo_database.mongodb]
# }
