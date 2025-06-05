FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80

ENV ASPNETCORE_URLS=http://+:80

USER app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG configuration=Release
WORKDIR /src
COPY ["apps/api-server/Bingo-Todo.csproj", "apps/api-server/"]
RUN dotnet restore "apps/api-server/Bingo-Todo.csproj"
COPY . .
WORKDIR "/src/apps/api-server"
RUN dotnet build "Bingo-Todo.csproj" -c $configuration -o /app/build

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "Bingo-Todo.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

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
ENTRYPOINT ["dotnet", "Bingo-Todo.dll"]
