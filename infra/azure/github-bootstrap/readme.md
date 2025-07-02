Set up CI/CD with Azure through GitHub Actions using a modified version of this sample

https://github.com/Azure-Samples/github-terraform-oidc-ci-cd/tree/main

## Entra and roles (RBAC)
The idea is that the CI/CD pipeline that runs on GitHub is able to create resources in the resource group created by the above implementation. However Entra is not managed resource-group level, so the app registrations needed for authentication and authorization are created by this module as well. 

By default, Terraform is capable of creating the resources in the resource group, but once certain resources like Container Apps or DocumentDB exists, it can't validate that they are unchanged because of the lack of rights to read certain attributes on them. In these cases the plan/apply/destroy action will fail with a clear-to-understand 403 message that includes the necessary missing permission. Extend the [custom role](./azure.resource.groups.tf) with the missing permission(s) and the issue will be fixed. 

### Admin Consent
A test agent app registration is created that needs admin consent to get an access token for the service app. If that's not granted, the authentication token acquired for the .default scope will not include the Application.Test role and so the requests sent from the integration tests will be unauthorized.

This means that once terraform apply ran, you should grant the permission for the test app.