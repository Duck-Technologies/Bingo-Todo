# data "azuread_service_principal" "msgraph" {
#   client_id = data.azuread_application_published_app_ids.well_known.result["MicrosoftGraph"]
# }

resource "random_uuid" "api_scope_id" {}

resource "azuread_application" "api_registration" {
  display_name     = "Bingo Todo API"
  sign_in_audience = "AzureADandPersonalMicrosoftAccount"
  description      = "A TODO app with a twist. Portfolio application."
  identifier_uris  = ["api://bingo-todo-api"]

  api {
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Allow access to the Bingo TODO API as a user."
      admin_consent_display_name = "Allow access to the Bingo TODO API as a user."
      enabled                    = true
      id                         = random_uuid.api_scope_id.result
      type                       = "User"
      user_consent_description   = "Allow access to the Bingo TODO API as a user."
      user_consent_display_name  = "Allow access to the Bingo TODO API as a user."
      value                      = "access_as_user"
    }
  }

  optional_claims {
    access_token {
      name = "profile"
    }
  }
}

# resource "azuread_application" "ui_registration" {
#   display_name     = "Bingo Todo UI"
#   sign_in_audience = "AzureADandPersonalMicrosoftAccount"
#   description      = "A TODO app with a twist. Portfolio application." 
# }

# resource "azuread_application_api_access" "api_configuration" {
#   application_id = azuread_application_registration.api_registration.id
#   api_client_id  = data.azuread_application_published_app_ids.well_known.result["MicrosoftGraph"]

#   role_ids = [
#     data.azuread_service_principal.msgraph.app_role_ids["Group.Read.All"],
#     data.azuread_service_principal.msgraph.app_role_ids["User.Read.All"],
#   ]

#   scope_ids = [
#     data.azuread_service_principal.msgraph.oauth2_permission_scope_ids["User.ReadWrite"],
#   ]
# }