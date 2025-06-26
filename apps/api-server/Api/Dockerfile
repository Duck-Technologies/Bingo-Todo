FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# ENV ASPNETCORE_URLS=http://:8080

USER app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG configuration=Release
WORKDIR /src
COPY ["./BingoTodo.Api.csproj", "apps/bingo-api/"]
RUN dotnet restore "apps/bingo-api/BingoTodo.Api.csproj"
COPY . "apps/bingo-api/"
WORKDIR "/src/apps/bingo-api"
RUN dotnet build "BingoTodo.Api.csproj" -c $configuration -o /app/build

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "BingoTodo.Api.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

ARG ASPNETCORE_ENVIRONMENT
ENV ASPNETCORE_ENVIRONMENT=$ASPNETCORE_ENVIRONMENT

ARG AZURE_COSMOS_LISTCONNECTIONSTRINGURL
ENV AZURE_COSMOS_LISTCONNECTIONSTRINGURL=$AZURE_COSMOS_LISTCONNECTIONSTRINGURL

ARG AZURE_COSMOS_RESOURCEENDPOINT
ENV AZURE_COSMOS_RESOURCEENDPOINT=$AZURE_COSMOS_RESOURCEENDPOINT

ARG MONGO_DB_NAME
ENV MONGO_DB_NAME=$MONGO_DB_NAME

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BingoTodo.Api.dll"]
