output "container_app_id" {
  value = azurerm_container_app.container_app.id
}

output "latest_revision_fqdn" {
  value = azurerm_container_app.container_app.latest_revision_fqdn
}