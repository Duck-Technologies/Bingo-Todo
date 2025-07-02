data "azurerm_resource_group" "container_rg" {
  name = var.resource_group_name
}

resource "azurerm_static_web_app" "front" {
  name                = var.web_app_name
  resource_group_name = data.azurerm_resource_group.container_rg.name
  location            = data.azurerm_resource_group.container_rg.location
  sku_size            = "Free"
  sku_tier            = "Free"
  tags                = var.tags
  repository_url      = var.repository_url
  repository_branch   = "main"
  repository_token    = var.repository_token
}