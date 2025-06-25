# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Beispiel: Dein Base-Image
FROM mcr.microsoft.com/dotnet/aspnet:7.0

# Zertifikat in Container kopieren (relativer Pfad muss zu deinem Build-Kontext passen)
COPY certs/devcert.crt /usr/local/share/ca-certificates/devcert.crt

# Zertifikat im System als trusted hinzufügen
RUN update-ca-certificates

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Wildblood.Tactics/Wildblood.Tactics/Wildblood.Tactics.csproj", "Wildblood.Tactics/Wildblood.Tactics/"]
COPY ["Wildblood.Tactics/Wildblood.Tactics.Client/Wildblood.Tactics.Client.csproj", "Wildblood.Tactics/Wildblood.Tactics.Client/"]
RUN dotnet restore "./Wildblood.Tactics/Wildblood.Tactics/Wildblood.Tactics.csproj"
COPY . .
WORKDIR "/src/Wildblood.Tactics/Wildblood.Tactics"
RUN dotnet build "./Wildblood.Tactics.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Wildblood.Tactics.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Wildblood.Tactics.dll"]