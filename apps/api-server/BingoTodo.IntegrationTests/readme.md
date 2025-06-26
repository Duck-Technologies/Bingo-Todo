# Local development
Use the [Docker Compose](docker-compose.debug.yml) file to spin up a Mongo DB instance, an API instance and run the integration tests. You can check the results of the run in Docker desktop in the integration test container logs.

Alternatively use one of the Docker Compose files in the Api folder to start up only the DB and API if your editor has richer debug features to run the integration tests yourself.

# Deployed app tests
While it's possible to create an in-memory API based on Program.cs using WebApplicationFactory, the point of this test suite is to test the deployed application.