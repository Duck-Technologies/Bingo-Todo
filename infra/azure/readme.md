Containing two terraform folders. More deailed readmes with instructions how to set everything up can be found in them.

## github-bootstrap
Sets up the CI/CD for Github and Entra related resources.

## resources
The actual resources needed to run the solution. Should be deployed with the CI/CD pipeline created by the bootstrap deployment.

It contains logic to create resources in one environment. This environment is specified by the github workflow file that starts the terraform plan/apply/destroy.