FROM mcr.microsoft.com/dotnet/sdk:9.0 AS buildtest
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY "./BingoTodo.UnitTests/BingoTodo.UnitTests.csproj" "./BingoTodo.UnitTests/BingoTodo.UnitTests.csproj"
COPY "./Api/BingoTodo.Api.csproj" "./Api/BingoTodo.Api.csproj"
RUN dotnet restore "./BingoTodo.UnitTests/BingoTodo.UnitTests.csproj"
COPY . .
WORKDIR "/src/BingoTodo.UnitTests"
RUN dotnet build "BingoTodo.UnitTests.csproj" -c $BUILD_CONFIGURATION

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS build
RUN apt-get update && apt-get install -y libcurl4
WORKDIR /test
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
COPY --from=buildtest /src/BingoTodo.UnitTests/bin/Debug/net9.0 ./test
ENTRYPOINT ["dotnet", "./test/BingoTodo.UnitTests.dll", "--results-directory", "/home/app/TestResults"]