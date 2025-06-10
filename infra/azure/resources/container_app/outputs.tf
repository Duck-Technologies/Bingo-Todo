output "container_app_id" {
  value = azurerm_container_app.container_app.id
}

output "latest_revision_fqdn" {
  value = "https://${azurerm_container_app.container_app.ingress[0].fqdn}"
}