# --- Base für die finale App (Runtime only) ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# --- Build-Stage ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Node.js installieren (brauchst du für TypeScript Build)
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Projekte kopieren
COPY ["Wildblood.Tactics/Wildblood.Tactics/Wildblood.Tactics.csproj", "Wildblood.Tactics/Wildblood.Tactics/"]
COPY ["Wildblood.Tactics/Wildblood.Tactics.Client/Wildblood.Tactics.Client.csproj", "Wildblood.Tactics/Wildblood.Tactics.Client/"]
RUN dotnet restore "./Wildblood.Tactics/Wildblood.Tactics/Wildblood.Tactics.csproj"

# Gesamtes Projekt kopieren und bauen
COPY . .
WORKDIR "/src/Wildblood.Tactics/Wildblood.Tactics"
RUN npm install
RUN dotnet build "./Wildblood.Tactics.csproj" -c $BUILD_CONFIGURATION -o /app/build

# --- Publish-Stage ---
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Wildblood.Tactics.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# --- Finales Image (nur Runtime + veröffentlichte App) ---
FROM base AS final
WORKDIR /app

# Wenn du ein Zertifikat brauchst (Optional)
# COPY certs/devcert.crt /usr/local/share/ca-certificates/devcert.crt
# RUN update-ca-certificates

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "Wildblood.Tactics.dll"]
