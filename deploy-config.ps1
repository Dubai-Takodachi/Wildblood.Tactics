#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automates deployment configuration for Wildblood.Tactics

.DESCRIPTION
    This script reads configuration from a .env file and updates all configuration files
    for production deployment of the Wildblood.Tactics application.

.EXAMPLE
    ./deploy-config.ps1
#>

# Function to load environment variables from .env file
function Load-EnvFile {
    param([string]$EnvPath = ".env")
    
    if (-not (Test-Path $EnvPath)) {
        Write-Host "❌ Environment file '$EnvPath' not found!" -ForegroundColor Red
        Write-Host "💡 Copy .env.example to .env and configure your credentials" -ForegroundColor Yellow
        exit 1
    }
    
    $envVars = @{}
    Get-Content $EnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $parts = $line.Split('=', 2)
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            $envVars[$key] = $value
        }
    }
    
    return $envVars
}

# Function to validate required environment variables
function Test-RequiredEnvVars {
    param([hashtable]$EnvVars)
    
    $requiredVars = @('DOMAIN', 'MONGO_USERNAME', 'MONGO_PASSWORD', 'SQL_PASSWORD',
                      'EMAIL_SMTP_SERVER', 'EMAIL_SMTP_PORT', 'EMAIL_SMTP_USER', 'EMAIL_SMTP_PASSWORD')
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not $EnvVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($EnvVars[$var])) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "❌ Missing required environment variables: $($missingVars -join ', ')" -ForegroundColor Red
        Write-Host "💡 Check your .env file and ensure all required variables are set" -ForegroundColor Yellow
        exit 1
    }
    
    return $true
}

# Function to generate secure password (keeping for backward compatibility)
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

# Load environment variables from .env file
$envVars = Load-EnvFile
Test-RequiredEnvVars -EnvVars $envVars

# Get configuration from environment variables
$Domain = $envVars['DOMAIN']
$MongoUsername = $envVars['MONGO_USERNAME']
$mongoPassword = $envVars['MONGO_PASSWORD']
$sqlPassword = $envVars['SQL_PASSWORD']
$emailSmtpServer = $envVars['EMAIL_SMTP_SERVER']
$emailSmtpPort = $envVars['EMAIL_SMTP_PORT']
$emailSmtpUser = $envVars['EMAIL_SMTP_USER']
$emailSmtpPassword = $envVars['EMAIL_SMTP_PASSWORD']
$emailFromName = if ($envVars.ContainsKey('EMAIL_FROM_NAME')) { $envVars['EMAIL_FROM_NAME'] } else { 'Wildblood Tactics' }

Write-Host "📁 Reading configuration from .env file" -ForegroundColor Yellow
Write-Host "📝 MongoDB Username: $MongoUsername" -ForegroundColor Cyan
Write-Host "📝 Email SMTP Server: $emailSmtpServer" -ForegroundColor Cyan
Write-Host "📝 Domain: $Domain" -ForegroundColor Cyan

# 1. Update docker-compose.yml
Write-Host "🔧 Updating docker-compose.yml..." -ForegroundColor Yellow

$dockerComposePath = "./docker-compose.yml"
if (Test-Path $dockerComposePath) {
    $dockerContent = Get-Content $dockerComposePath -Raw
    
    # Update MONGO_CONNECTION_STRING
    $dockerContent = $dockerContent -replace 'MONGO_CONNECTION_STRING=mongodb://testuser:TestMongo123!@mongodb:27017', "MONGO_CONNECTION_STRING=mongodb://$($MongoUsername):$($mongoPassword)@mongodb:27017"
    
    # Remove https://+:8081 from ASPNETCORE_URLS
    $dockerContent = $dockerContent -replace 'ASPNETCORE_URLS=http://\+:8080;https://\+:8081', 'ASPNETCORE_URLS=http://+:8080'
    
    # Update SA_PASSWORD
    $dockerContent = $dockerContent -replace 'SA_PASSWORD: "TestSQL456!"', "SA_PASSWORD: `"$sqlPassword`""
    
    # Update MONGO_INITDB_ROOT_USERNAME
    $dockerContent = $dockerContent -replace 'MONGO_INITDB_ROOT_USERNAME: testuser', "MONGO_INITDB_ROOT_USERNAME: $MongoUsername"
    
    # Update MONGO_INITDB_ROOT_PASSWORD
    $dockerContent = $dockerContent -replace 'MONGO_INITDB_ROOT_PASSWORD: TestMongo123!', "MONGO_INITDB_ROOT_PASSWORD: $mongoPassword"
    
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
    
    # Update EmailSettings
    if (-not $appsettingsContent.EmailSettings) {
        $appsettingsContent | Add-Member -MemberType NoteProperty -Name EmailSettings -Value ([PSCustomObject]@{})
    }
    $appsettingsContent.EmailSettings.SmtpServer = $emailSmtpServer
    $appsettingsContent.EmailSettings.SmtpPort = [int]$emailSmtpPort
    $appsettingsContent.EmailSettings.SmtpUser = $emailSmtpUser
    $appsettingsContent.EmailSettings.SmtpPassword = $emailSmtpPassword
    $appsettingsContent.EmailSettings.FromName = $emailFromName
    
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
Write-Host "MongoDB Password: [HIDDEN]" -ForegroundColor White
Write-Host "SQL Password: [HIDDEN]" -ForegroundColor White
Write-Host "Email SMTP Server: $emailSmtpServer" -ForegroundColor White
Write-Host "Email SMTP Port: $emailSmtpPort" -ForegroundColor White
Write-Host "Email SMTP User: $emailSmtpUser" -ForegroundColor White
Write-Host "Email SMTP Password: [HIDDEN]" -ForegroundColor White
Write-Host "Email From Name: $emailFromName" -ForegroundColor White
Write-Host "Domain: $Domain" -ForegroundColor White
Write-Host "Hub URL: https://$Domain/tacticshub" -ForegroundColor White

# Save configuration to file for reference (without passwords)
$configSummary = @{
    "MongoDB" = @{
        "Username" = $MongoUsername
        "Password" = "[HIDDEN - Check .env file]"
    }
    "SQL" = @{
        "Password" = "[HIDDEN - Check .env file]"
    }
    "Email" = @{
        "SmtpServer" = $emailSmtpServer
        "SmtpPort" = $emailSmtpPort
        "SmtpUser" = $emailSmtpUser
        "SmtpPassword" = "[HIDDEN - Check .env file]"
        "FromName" = $emailFromName
    }
    "Domain" = $Domain
    "HubURL" = "https://$Domain/tacticshub"
    "GeneratedAt" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "ConfigurationSource" = ".env file"
}

$configSummary | ConvertTo-Json -Depth 10 | Set-Content "./deployment-config.json"

Write-Host "🎉 Deployment configuration completed successfully!" -ForegroundColor Green
Write-Host "📄 Configuration summary saved to: deployment-config.json" -ForegroundColor Cyan
Write-Host "💡 Configuration read from: .env file" -ForegroundColor Yellow