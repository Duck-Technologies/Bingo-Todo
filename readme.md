# About
A gamified TODO app with two modes
- a traditional BINGO mode where the user sets their tasks and a reward, and earns said reward when a row, column or diagonal set of tasks are marked as completed
- and a version more aligned with TODO apps, where all tasks have to be marked as completed to earn the final reward, but sub-rewards can be earned with the traditional patterns described above

> For the current stable deployed version see the URL in the About section.

## What is this all about?
While I would be happy to talk about any of your questions in an interview, my aim with this project is to demonstrate what I'm capable of based on my previous experiences as a full-stack developer. Besides the code I would also like to give a sense of my documentation and [project management skills](https://github.com/orgs/Duck-Technologies/projects/1). Hopefully the fact that this application has a CI/CD setup and is deployed to Azure will also convince you that I know a thing or two about the infrastructure side of things.

# Tech stack
The front end is written in Angular, the API is .NET based, and storage is done using MongoDB.

# Getting started
To develop the backend locally you have to install the following:
- .NET 9.0
- mongosh >2.5.1
- Docker
- A [compatible node version](https://angular.dev/reference/versions) with Angular 20. The web app's package.json references a specific node engine because that's how you can tell the Azure Static Web App deployment [to use an appropriate one](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration?tabs=identity&pivots=github-actions#custom-build-commands).

Starting the API
- use the [docker-compose.yml file](api-server/Api/docker-compose.yml) to build and start the DB and the API from the root folder

Starting the UI
- See [the readme of the web app](./apps/web-app/README.md)