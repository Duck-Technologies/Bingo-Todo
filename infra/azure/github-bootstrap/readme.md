Set up CI/CD with Azure through GitHub Actions using a modified version of this sample

https://github.com/Azure-Samples/github-terraform-oidc-ci-cd/tree/main

## Entra and roles (RBAC)
The idea is that the CI/CD pipeline that runs on GitHub is able to create resources in the resource group created by the above implementation. However Entra is not managed resource-group level, so the app registrations needed for authentication and authorization are created by this module as well. Other role based accesses are also configured here, like "DocumentDB Account Contributor", "Container Apps Operator", roles needed to manage the resources.

These roles might grant execution rights to more actions than needed for Terraform to operate, so in a production use case it would be better to create a custom role that only enables the actions that are actually needed for Terraform. (Here it's not a concern because this is a one-man-project, so I have administrator rights to do anything anyway, and it was easier/faster to just pick a built-in role that includes the permissions to the actions Tf needed.)

To be more concrete, Terraform is capable of creating the resources in the resource group, but once certain resources like Container Apps or DocumentDB exists, it can't validate that they are unchanged because of the lack of rights to read certain attributes on them.

### Admin Consent
A test agent app registration is created that needs admin consent to get an access token for the service app. If that's not granted, the authentication token acquired for the .default scope will not include the Application.Test role and so the requests sent from the integration tests will be unauthorized.

This means that once terraform apply ran, you should grant the permission for the test app.