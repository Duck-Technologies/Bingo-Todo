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
- nodeJS 22

Starting the API
- use the [docker-compose.yml file](api-server/docker-compose.yml) to build and start the DB and the API from the root folder

Starting the UI
- TODO