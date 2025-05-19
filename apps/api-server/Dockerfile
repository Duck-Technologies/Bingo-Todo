FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5043

ENV ASPNETCORE_URLS=http://+:5043

USER app
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
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

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Bingo-Todo.dll"]
