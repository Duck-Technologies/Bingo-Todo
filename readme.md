# BINGO-TODO
A gamified TODO app with two modes
- a traditional BINGO where the user sets their tasks and a reward, and earns said reward when a row, column or diagonal set of tasks are marked as completed
- and a version more aligned with TODO apps, where all tasks have to be marked as completed to earn the final reward, but sub-rewards can be earned with the traditional rule mentioned above

# Tech stack
The front end is written in Angular, the API is .NET based, and storage is done using MongoDB.

# Getting started
To develop locally you have to install the following:
- .NET 9.0
- mongosh >2.5.1
- Docker
- A [compatible node version](https://angular.dev/reference/versions) with Angular 20. The web app's package.json references a specific node engine because that's how you can tell the Azure Static Web App deployment [to use an appropriate one](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration?tabs=identity&pivots=github-actions#custom-build-commands).

Starting the API
- use the [docker-compose.yml file](api-server/Api/docker-compose.yml) to build and start the DB and the API from the root folder

Starting the UI
- TODO