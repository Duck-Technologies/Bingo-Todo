data "azuread_client_config" "current" {}

resource "random_uuid" "api_scope_id" {}
resource "random_uuid" "test_role_id" {
  count = var.add_test_appreg ? 1 : 0
}

## API

resource "azuread_application" "api_registration" {
  display_name     = "${var.app_display_name} Service | ${var.environment}"
  sign_in_audience = "AzureADandPersonalMicrosoftAccount"
  identifier_uris  = ["api://${var.app_name}-api"]
  owners           = [data.azuread_client_config.current.object_id]

  api {
    requested_access_token_version = 2

    ## this would save the user one click if I used the azuread_application_api_access resource 
    ## to give permission for the UI to use the access_as_user scope to avoid circular dependency
    # known_client_applications = [
    #   azuread_application.ui_registration.client_id
    # ]

    oauth2_permission_scope {
      admin_consent_description  = "Allow access to the ${var.app_display_name} Service as a user."
      admin_consent_display_name = "Allow access to the ${var.app_display_name} Service as a user."
      enabled                    = true
      id                         = random_uuid.api_scope_id.result
      type                       = "User"
      user_consent_description   = "Allow access to the ${var.app_display_name} Service as a user."
      user_consent_display_name  = "Allow access to the ${var.app_display_name} Service as a user."
      value                      = "access_as_user"
    }
  }

  dynamic "app_role" {
    for_each = var.add_test_appreg ? [1] : []
    content {
      allowed_member_types = ["Application"]
      description          = "Role to be used by test agents to access the API"
      display_name         = "Test Agent"
      enabled              = true
      id                   = random_uuid.test_role_id[0].result
      value                = "Application.TestAgent"
    }
  }

  # even if your app doesn't need access to Microsoft Graph,
  # without asking consent to at least one scope,
  # the user won't be asked for their permission to use the app
  # and so the UI won't be able to get an access token for them
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    # resource_access {
    #   id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # email
    #   type = "Scope"
    # }

    resource_access {
      id   = "97235f07-e226-4f63-ace3-39588e11d3a1" # User.ReadBasic.All
      type = "Role"
    }
  }

  # optional_claims {
  #   access_token {
  #     name = "email"
  #   }
  # }
}

resource "azuread_service_principal" "api_principal" {
  count                        = var.add_test_appreg ? 1 : 0
  client_id                    = azuread_application.api_registration.client_id
  app_role_assignment_required = true
  owners                       = [data.azuread_client_config.current.object_id]

  feature_tags {
    enterprise = true
  }

  depends_on = [azuread_application.api_registration]
}



## Test Agent

resource "time_rotating" "test_secret" {
  count         = var.add_test_appreg ? 1 : 0
  rotation_days = 180
}

resource "azuread_application" "test_agent_registration" {
  count            = var.add_test_appreg ? 1 : 0
  display_name     = "${var.app_display_name} test agent"
  sign_in_audience = "AzureADMyOrg"
  description      = "A test agent for the ${var.app_display_name} solution"
  owners           = [data.azuread_client_config.current.object_id]

  api {
    requested_access_token_version = 2
  }

  password {
    display_name = "Test Agent Secret"
    start_date   = time_rotating.test_secret[0].id
    end_date     = timeadd(time_rotating.test_secret[0].id, "4320h")
  }

  required_resource_access {
    resource_app_id = azuread_application.api_registration.client_id

    resource_access {
      id   = random_uuid.test_role_id[0].result // Application.TestAgent 
      type = "Role"
    }
  }
}

resource "azuread_service_principal" "test_principal" {
  count                        = var.add_test_appreg ? 1 : 0
  client_id                    = azuread_application.test_agent_registration[0].client_id
  app_role_assignment_required = true
  owners                       = [data.azuread_client_config.current.object_id]

  feature_tags {
    enterprise = true
  }

  depends_on = [azuread_application.test_agent_registration[0]]
}



## User Interface

resource "azuread_application" "ui_registration" {
  display_name     = "${var.app_display_name} User Interface | ${var.environment}"
  sign_in_audience = "PersonalMicrosoftAccount"
  owners           = [data.azuread_client_config.current.object_id]

  api {
    requested_access_token_version = 2
  }

  single_page_application {
    redirect_uris = var.ui_urls
  }

  required_resource_access {
    resource_app_id = azuread_application.api_registration.client_id

    resource_access {
      id   = random_uuid.api_scope_id.result // access_as_user 
      type = "Scope"
    }
  }

  depends_on = [azuread_application.api_registration]
}

# not sure if this actually does anything substantial, during first time the user has to consent anyway 
# (which is what this block supposed to prevent)
resource "azuread_application_pre_authorized" "ui_preauthorized" {
  application_id       = azuread_application.api_registration.id
  authorized_client_id = azuread_application.ui_registration.client_id

  permission_ids = [
    random_uuid.api_scope_id.result
  ]

  depends_on = [azuread_application.ui_registration]
}
