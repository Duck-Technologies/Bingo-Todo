output "service_client_id" {
  value = azuread_application.api_registration.client_id
}

output "ui_client_id" {
  value = azuread_application.ui_registration.client_id
}

output "test_client_id" {
  value = var.add_test_appreg ? azuread_application.test_agent_registration[0].client_id : null
}

output "test_client_secret" {
  sensitive = true
  value     = var.add_test_appreg ? tolist(azuread_application.test_agent_registration[0].password).0.value : null
}

output "service_user_impersonation_scope" {
  value = "api://${var.app_name}-api/access_as_user"
}

output "environment" {
  value = var.environment
}