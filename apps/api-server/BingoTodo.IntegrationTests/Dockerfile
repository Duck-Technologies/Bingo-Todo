FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY "./BingoTodo.IntegrationTests.csproj" .
RUN dotnet restore

COPY . .
RUN dotnet build

ENTRYPOINT ["dotnet", "test", "--no-build", "--logger:trx"]