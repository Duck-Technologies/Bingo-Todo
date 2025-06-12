# Overview and Setup
Terraform setup to create the resources necessary to run the app in Azure for one environment.

This part of the code requires the github-bootstrap folder to be run first locally. That sets up GitHub Actions to be able to manage resources in a given resource group.

Another requirement is to create an "access_token_for_terraform" environment secret with a github access token that has write access to the repository. This is needed for certain terraform outputs to be stored as environment variables. These variables are needed for building and deploying the app.

## Running the Continuous Delivery step
As of now all resources can't be created using one terraform action. The reason for this is that creating an Azure Container App is impossible without a valid container image. That's because I think the container image creation and storage should be decoupled from other parts of the infrastructure, as generally I think terraform should be responsible for creating resources and not for building and deploying to existing resources. (An argument for this is that this is a monorepo with multiple resources. Terraform should be able to set up all parts of the app while I might only want to build & deploy the UI or the API.)

Container App creation as far as Terraform is concerned requires a valid container image to be available (Azure does create a container app, but it doesn't give a success response - or something like that - before it can pull a Docker image - which is not available at the first terraform apply, as there's no build image step in it).

So to make the API work, the flow is the following:

- Run terraform apply, which should be able to create all resources except the Container App
- Delete the created Container App in Azure (terraform doesn't think it was created, but will throw a conflict error when you try the second terraform apply)
- Build a container image using the api-build pipeline that will build and publish the image to the Azure Container Registry
- Run the second terraform apply, which should succeed
- Open the Container App in the Azure Portal and enable the Service Container for the CosmosDB MongoDB resource, so that the running app can get the CosmosDB connection string using managed identity (this manual step is required because Terraform doesn't yet support it, as Service Connector for Container Apps is in preview)

# Choices made
### No secrets.

Most of these resources support Azure Managed Identity, and we rely on that to prompt the necessary rights to the resources to perform certain actions rather than usernames and passwords (for example the container app is granted the pull right needed to access an image from the container registry). An exception is Cosmos DB's MongoDB access, where a [Service Connector](https://learn.microsoft.com/en-us/azure/service-connector/how-to-integrate-cosmos-db?tabs=dotnet) is used to access the connection string (that includes the user name and password, so there's no need to store the password in a Key Vault etc. instead managed identity is used to allow the Container App to retrieve the connection string.)

### Pricing
This is a small-scale portfolio app, and keeping costs to the absolute minimum was key. Container apps can scale to 0 (in which case there's no associated cost), so that's why it was chosen over App Services. The CosmosDB account is a free tier one too, so creating it would fail if you already have an existing account in your subscription.

In case you use a free trial Azure subscription, you might not be able to push images to Azure container registry, so your option is either to not use the container registry, or to use another type of subscription (this is noted in he [Registry Tasks Overview](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-overview))

### Not using [acr-build](https://github.com/Azure/acr-build/tree/main)
It uses service principal to log in to Azure, while I'm relying on Managed Identity.

### Not using [container-apps-deploy-action](https://github.com/Azure/container-apps-deploy-action)
It is a deploy and/or create resource solution, and I want to keep my resource creations up to Terraform. In an ideal scenario deployment would be handled by a managed identity that can't create resources, but for now I'm using the same managed identity for deployment as the one that does terraform apply. Living with this solution it feels safer to use `az containerapp update` which won't create new resources in case I make a mistake referencing a named resource etc.