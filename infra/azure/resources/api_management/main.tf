data "azurerm_resource_group" "container_rg" {
  name = var.resource_group_name
}

data "azurerm_container_app" "container_app" {
  name                = var.container_app_name
  resource_group_name = data.azurerm_resource_group.container_rg.name
}

# https://www.mytechramblings.com/posts/how-to-update-an-azure-api-mgmt-api-that-uses-a-remote-openapi-using-terraform/
data "http" "openapi_def" {
  url = "https://${data.azurerm_container_app.container_app.ingress[0].fqdn}/openapi/v1.json"
  request_headers = {
    Accept = "application/json"
  }
}

resource "azurerm_api_management" "management" {
  name                = var.management_name
  location            = data.azurerm_resource_group.container_rg.location
  resource_group_name = data.azurerm_resource_group.container_rg.name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_mail

  sku_name = "Consumption_0"
}

resource "azurerm_api_management_api_version_set" "version_set" {
  name                = "${var.api_name}_vset"
  resource_group_name = data.azurerm_resource_group.container_rg.name
  api_management_name = azurerm_api_management.management.name
  display_name        = "${var.api_path}"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_api" "api" {
  name                  = var.api_name
  resource_group_name   = data.azurerm_resource_group.container_rg.name
  api_management_name   = azurerm_api_management.management.name
  revision              = var.revision
  display_name          = data.azurerm_container_app.container_app.name
  path                  = var.api_path
  protocols             = ["https"]
  service_url           = "https://${data.azurerm_container_app.container_app.ingress[0].fqdn}"
  subscription_required = false
  version               = "v1"
  version_set_id        = azurerm_api_management_api_version_set.version_set.id 

  import {
    content_format = "openapi+json"
    content_value  = data.http.openapi_def.response_body
  }
}