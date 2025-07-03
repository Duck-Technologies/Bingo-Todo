# Overview and Setup
Terraform setup to create the resources necessary to run the app in Azure for one environment.

This part of the code requires the github-bootstrap folder to be run first locally. That sets up GitHub Actions to be able to manage resources in a given resource group.

Another requirement is to create an "access_token_for_terraform" environment secret with a github access token that has write access to the repository. This is needed for certain terraform outputs to be stored as environment variables. These variables are needed for building and deploying the app.

Once Azure Static Web App is set up, you should take the web app URLs and add it to the [variables file](../github-bootstrap/variables.tf) so it can modify the App Registration and set the given URLs as redirect targets. If you have a custom domain, you might be able to calculate these URLs when you first run the github-bootstrap folder, before the static web app is created.

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
### No secrets

Most of these resources support Azure Managed Identity, and we rely on that to prompt the necessary rights to the resources to perform certain actions rather than usernames and passwords (for example the container app is granted the pull right needed to access an image from the container registry). An exception is Cosmos DB's MongoDB access, where a [Service Connector](https://learn.microsoft.com/en-us/azure/service-connector/how-to-integrate-cosmos-db?tabs=dotnet) is used to access the connection string (that includes the user name and password, so there's no need to store the password in a Key Vault etc. instead managed identity is used to allow the Container App to retrieve the connection string.)

### Pricing
This is a small-scale portfolio app, and keeping costs to the absolute minimum was key. Container apps can scale to 0 (in which case there's no associated cost), so that's why it was chosen over App Services. The CosmosDB account is a free tier one too, so creating it would fail if you already have an existing account in your subscription.

In case you use a free trial Azure subscription, you might not be able to push images to Azure container registry, so your option is either to not use the container registry, or to use another type of subscription (this is noted in he [Registry Tasks Overview](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-overview))

### Not using [acr-build](https://github.com/Azure/acr-build/tree/main)
It uses service principal to log in to Azure, while I'm relying on Managed Identity.

### Not using [container-apps-deploy-action](https://github.com/Azure/container-apps-deploy-action)
It is a deploy and/or create resource solution, and I want to keep my resource creations up to Terraform. In an ideal scenario deployment would be handled by a managed identity that can't create resources, but for now I'm using the same managed identity for deployment as the one that does terraform apply. Living with this solution it feels safer to use `az containerapp update` which won't create new resources in case I make a mistake referencing a named resource etc.

### Authentication, API Management middleman and public network access
The Container App instance can scale to 0, and I'd like to keep it scaled to 0 most of the time unless a legit user is calling it from the browser. If bots or unauthorized users try to call it, the app could be constantly awake doing nothing else but authenticating the requests and refusing them. The built-in authentication Azure provides for Container Apps [runs a sidecar in a replica](https://learn.microsoft.com/en-us/azure/container-apps/authentication#feature-architecture) which to my understanding still means that the app would keep it running just do deal with these requests.

Here comes API Management into the picture with its [validate-azure-ad-token](https://learn.microsoft.com/en-us/azure/api-management/validate-azure-ad-token-policy) policy. As a middleman between the clients and the Container App, it rejects unauthorized requests almost free of charge, and so the Container App can only ever be awaken with requests that passed the token validation.

Ideally with this setup the Container App would not be accessible publicly, but currently even the cheapest APIM tier that has virtual network support is too expensive for a project like this. That means that the container app's URL has to be treated like a secret despite it being accessible from the public internet.

A drawback of this setup is that the APIM policy can only return generic 401 responses, so it won't help you figuring out why your token is invalid. Also, if you don't need other functionalities of APIM, and running at least one replica of the Container App constantly is not a concern for you, you can ditch this middle layer.

Additionally, the server also validates the token. A big reason for this is that the APIM layer doesn't handle Authorization (checking if you have the right roles etc.), and also to keep the API access consistent between local development and the deployed version.

### CORS
Because the user interface and the API is deployed on two different hosts, the server needs to be set up to allow cross origin requests, otherwise the browser will reject the requests.

There are 3 places where CORS can be set up, 1. the server itself, 2. the API Management and the 3. Container App resource. Because all requests are going through the APIM layer, I found out that CORS doesn't need to be configured on the Container App layer or the server itself, so CORS is configured with the [cors-policy](https://learn.microsoft.com/en-us/azure/api-management/cors-policy).


# Other
## Notes on the Static Web App deployment
repository_url, repository_branch and repository_token are marked as non-required on the terraform documentation for azurerm_static_web_app, however I didn't have success deploying the app without them. Also, setting these up once the resource was created did nothing, so I had to recreate the resource with these provided. Creating the web app like this puts an automatically generated workflow file into your .github folder. As far as I understand, you are free to modify it (you even have to, for example in the case of Angular to tell it the app_location and output_location), but you shouldn't rename it.

[As noted](https://learn.microsoft.com/en-gb/azure/static-web-apps/get-started-portal?tabs=vanilla-javascript&pivots=github#create-a-static-web-app), you might have to authorize Azure Static Web Apps in Github (Settings > Applications > Authorized OAuth Apps) so it can create the yaml file.

## The use of a PAT in terraform
Terraform can handle Github environment/repository variables and secrets to store information about the created resources (like the URLs of the API or Web App, because this solution is not utilizing a custom domain). For simplicity, a PAT is passed to terraform, which wouldn't be the right choice for an actual application. Long term it would be better to migrate to GitHub Apps to provide terraform short-lived access tokens.