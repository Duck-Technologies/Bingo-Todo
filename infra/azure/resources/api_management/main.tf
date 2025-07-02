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
  tags     = var.tags
}

resource "azurerm_api_management_api_version_set" "version_set" {
  name                = "${var.api_name}_vset"
  resource_group_name = data.azurerm_resource_group.container_rg.name
  api_management_name = azurerm_api_management.management.name
  display_name        = var.api_path
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
  version               = var.path_version
  version_set_id        = azurerm_api_management_api_version_set.version_set.id

  import {
    content_format = "openapi+json"
    content_value  = data.http.openapi_def.response_body
  }
}

locals {
  client_app_ids = join("", [
    for client_id in var.container_app_client_ids : "<application-id>${client_id}</application-id>"
  ])
}

resource "azurerm_api_management_api_policy" "api_policy" {
  api_name            = azurerm_api_management_api.api.name
  api_management_name = azurerm_api_management.management.name
  resource_group_name = data.azurerm_resource_group.container_rg.name

  xml_content = <<XML
<policies>
    <!-- Throttle, authorize, validate, cache, or transform the requests -->
    <inbound>
        <base />
        <validate-azure-ad-token tenant-id="common" header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized. Access token is missing or invalid.">
            <backend-application-ids>
                <application-id>${var.container_app_client_id}</application-id>
                <!-- If there are multiple backend application IDs, then add additional application-id elements -->
            </backend-application-ids>
            <client-application-ids>
                ${local.client_app_ids}
                <!-- If there are multiple client application IDs, then add additional application-id elements -->
            </client-application-ids>
            <audiences>
                <audience>${var.container_app_client_id}</audience>
                <!-- if there are multiple possible audiences, then add additional audience elements -->
            </audiences>
        </validate-azure-ad-token>
    </inbound>
    <!-- Control if and how the requests are forwarded to services  -->
    <backend>
        <base />
    </backend>
    <!-- Customize the responses -->
    <outbound>
        <base />
    </outbound>
    <!-- Handle exceptions and customize error responses  -->
    <on-error>
        <base />
    </on-error>
</policies>
XML
}