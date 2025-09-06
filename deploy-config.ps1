#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automates deployment configuration for Wildblood.Tactics

.DESCRIPTION
    This script generates secure passwords and updates all configuration files
    for production deployment of the Wildblood.Tactics application.

.PARAMETER Domain
    The domain name for the production deployment (default: Wildblood-Tactics.de)

.PARAMETER MongoUsername
    The MongoDB username (default: wildblood)

.EXAMPLE
    ./deploy-config.ps1
    ./deploy-config.ps1 -Domain "my-domain.com" -MongoUsername "myuser"
#>

param(
    [string]$Domain = "Wildblood-Tactics.de",
    [string]$MongoUsername = "wildblood"
)

# Function to generate secure password
function Generate-SecurePassword {
    param([int]$Length = 16)
    
    # Use alphanumeric + safe special characters that don't interfere with shell/env parsing
    $charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@$%*+=?-_"
    $password = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $password += $charset[(Get-Random -Maximum $charset.Length)]
    }
    return $password
}

Write-Host "🚀 Wildblood.Tactics Deployment Configuration Automation" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Generate secure passwords
$mongoPassword = Generate-SecurePassword -Length 20
$sqlPassword = Generate-SecurePassword -Length 20

Write-Host "✅ Generated secure passwords" -ForegroundColor Yellow
Write-Host "📝 MongoDB Username: $MongoUsername" -ForegroundColor Cyan
Write-Host "📝 Domain: $Domain" -ForegroundColor Cyan

# 1. Update docker-compose.yml
Write-Host "🔧 Updating docker-compose.yml..." -ForegroundColor Yellow

$dockerComposePath = "./docker-compose.yml"
if (Test-Path $dockerComposePath) {
    $dockerContent = Get-Content $dockerComposePath -Raw
    
    # Update MONGO_CONNECTION_STRING
    $dockerContent = $dockerContent -replace 'MONGO_CONNECTION_STRING=mongodb://admin:password@mongodb:27017', "MONGO_CONNECTION_STRING=mongodb://$($MongoUsername):$($mongoPassword)@mongodb:27017"
    
    # Remove https://+:8081 from ASPNETCORE_URLS
    $dockerContent = $dockerContent -replace 'ASPNETCORE_URLS=http://\+:8080;https://\+:8081', 'ASPNETCORE_URLS=http://+:8080'
    
    # Update SA_PASSWORD
    $dockerContent = $dockerContent -replace 'SA_PASSWORD: "DeinStarkesPasswort123!"', "SA_PASSWORD: `"$sqlPassword`""
    
    # Update MONGO_INITDB_ROOT_USERNAME
    $dockerContent = $dockerContent -replace 'MONGO_INITDB_ROOT_USERNAME: admin', "MONGO_INITDB_ROOT_USERNAME: $MongoUsername"
    
    # Update MONGO_INITDB_ROOT_PASSWORD
    $dockerContent = $dockerContent -replace 'MONGO_INITDB_ROOT_PASSWORD: password', "MONGO_INITDB_ROOT_PASSWORD: $mongoPassword"
    
    Set-Content $dockerComposePath -Value $dockerContent
    Write-Host "   ✅ docker-compose.yml updated" -ForegroundColor Green
} else {
    Write-Host "   ❌ docker-compose.yml not found!" -ForegroundColor Red
    exit 1
}

# 2. Update appsettings.json
Write-Host "🔧 Updating appsettings.json..." -ForegroundColor Yellow

$appsettingsPath = "./Wildblood.Tactics/Wildblood.Tactics/appsettings.json"
if (Test-Path $appsettingsPath) {
    $appsettingsContent = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
    
    # Update DefaultConnection
    $appsettingsContent.ConnectionStrings.DefaultConnection = "Server=mssql_container,1433;Database=master;User Id=sa;Password=$sqlPassword;Encrypt=False;"
    
    # Update MongoDBConnection
    $appsettingsContent.ConnectionStrings.MongoDBConnection = "mongodb://$($MongoUsername):$($mongoPassword)@mongodb:27017"
    
    # Update MongoDbSettings.ConnectionString
    $appsettingsContent.MongoDbSettings.ConnectionString = "mongodb://$($MongoUsername):$($mongoPassword)@mongodb:27017"
    
    $appsettingsContent | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath
    Write-Host "   ✅ appsettings.json updated" -ForegroundColor Green
} else {
    Write-Host "   ❌ appsettings.json not found!" -ForegroundColor Red
    exit 1
}

# 3. Update HubConnectionService.cs
Write-Host "🔧 Updating HubConnectionService.cs..." -ForegroundColor Yellow

$hubServicePath = "./Wildblood.Tactics/Wildblood.Tactics/Services/HubConnectionService.cs"
if (Test-Path $hubServicePath) {
    $hubContent = Get-Content $hubServicePath -Raw
    
    # Update HubConnectionBuilder.WithUrl
    $hubContent = $hubContent -replace 'navigationManager\.ToAbsoluteUri\("/tacticsHub"\)', "`"https://$Domain/tacticshub`""
    
    Set-Content $hubServicePath -Value $hubContent
    Write-Host "   ✅ HubConnectionService.cs updated" -ForegroundColor Green
} else {
    Write-Host "   ❌ HubConnectionService.cs not found!" -ForegroundColor Red
    exit 1
}

# Create configuration summary
Write-Host "📋 Configuration Summary" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "MongoDB Username: $MongoUsername" -ForegroundColor White
Write-Host "MongoDB Password: $mongoPassword" -ForegroundColor White
Write-Host "SQL Password: $sqlPassword" -ForegroundColor White
Write-Host "Domain: $Domain" -ForegroundColor White
Write-Host "Hub URL: https://$Domain/tacticshub" -ForegroundColor White

# Save configuration to file for reference
$configSummary = @{
    "MongoDB" = @{
        "Username" = $MongoUsername
        "Password" = $mongoPassword
    }
    "SQL" = @{
        "Password" = $sqlPassword
    }
    "Domain" = $Domain
    "HubURL" = "https://$Domain/tacticshub"
    "GeneratedAt" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$configSummary | ConvertTo-Json -Depth 10 | Set-Content "./deployment-config.json"

Write-Host "🎉 Deployment configuration completed successfully!" -ForegroundColor Green
Write-Host "📄 Configuration saved to: deployment-config.json" -ForegroundColor Cyan
Write-Host "⚠️  Please save the passwords securely and delete deployment-config.json after noting them!" -ForegroundColor Yellow