output "api_key" {
  value     = azurerm_static_web_app.front.api_key
  sensitive = true
}

output "prod_url" {
  value = "https://${azurerm_static_web_app.front.default_host_name}"
}

output "staging_url" {
  value = replace("https://${azurerm_static_web_app.front.default_host_name}", "/[.]\\d/", "-staging$0")
}