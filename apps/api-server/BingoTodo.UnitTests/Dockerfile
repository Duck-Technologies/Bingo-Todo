FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY "./BingoTodo.UnitTests.csproj" .
RUN dotnet restore

COPY . .
RUN dotnet build

RUN dotnet test --no-build --logger:console;verbosity=detailed