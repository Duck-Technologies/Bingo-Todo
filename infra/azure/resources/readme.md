Terraform setup to create the resources necessary to run the app in Azure for one environment.

This part of the code requires the github-bootstrap folder to be run first locally. That sets up GitHub Actions to be able to manage resources in a given resource group.

Another requirement is to create an "access_token_for_terraform" environment secret with a github access token that has write access to the repository. This is needed for certain terraform outputs to be stored as environment variables. These variables are needed for building and deploying the app.

# Choices made
### No secrets.

Most of these resources support Azure Managed Identity, and we rely on that to prompt the necessary rights to the resources to perform certain actions rather than usernames and passwords (for example the container app is granted the pull right needed to access an image from the container registry).

### Pricing
This is a small-scale portfolio app, and keeping costs to the absolute minimum was key. Container apps can scale to 0 (in which case there's no associated cost), so that's why it was chosen over App Services. The CosmosDB account is a free tier one too, so creating it would fail if you already have an existing account in your subscription.