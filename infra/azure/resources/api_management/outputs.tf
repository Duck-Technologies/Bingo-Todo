output "api_url" {
  value = "${azurerm_api_management.management.gateway_url}/${var.api_path}/${var.version}"
}