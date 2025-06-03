data "azurerm_resource_group" "container_rg" {
  name = var.resource_group_name
}

resource "azurerm_container_registry" "container_registry" {
  name                = var.registry_name
  resource_group_name = data.azurerm_resource_group.container_rg.name
  location            = data.azurerm_resource_group.container_rg.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = var.tags

  depends_on = [
    data.azurerm_resource_group.container_rg
  ]
}