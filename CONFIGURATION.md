# Configuration Guide

This document describes the configuration settings for the Wildblood.Tactics application and highlights credentials that should be secured.

## Security Notice

**IMPORTANT**: The `appsettings.json` file now contains placeholder values for all credentials. Real credentials should be provided through secure configuration sources (User Secrets for development, environment variables or secret vaults for production).

## Configuration Sections

### 1. Email Settings (✅ Fixed)

Email credentials are now configured in `appsettings.json` using placeholder values and loaded via dependency injection.

**Location**: `appsettings.json` > `EmailSettings`

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.example.com",
    "SmtpPort": 587,
    "SmtpUser": "noreply@example.com",
    "SmtpPassword": "your-smtp-password-here",
    "FromName": "Your Application Name"
  }
}
```

**Recommendation**: Provide real credentials via:
- User Secrets for development (`dotnet user-secrets set "EmailSettings:SmtpPassword" "your-password"`)
- Azure Key Vault, AWS Secrets Manager, or environment variables for production

### 2. Google OAuth Credentials (✅ Placeholders)

**Location**: `appsettings.json` > `Google`

```json
{
  "Google": {
    "ClientId": "your-google-client-id-here.apps.googleusercontent.com",
    "ClientSecret": "your-google-client-secret-here"
  }
}
```

**Recommendation**: Provide real credentials via:
- User Secrets for development (`dotnet user-secrets set "Google:ClientSecret" "your-secret"`)
- Secure configuration provider for production (Azure Key Vault, environment variables, etc.)

### 3. Database Connection Strings (✅ Placeholders)

**Location**: `appsettings.json` > `ConnectionStrings`

#### SQL Server
```json
"DefaultConnection": "Server=mssql,1433;Database=master;User Id=sa;Password=your-sql-password-here;Encrypt=False;"
```

#### MongoDB
```json
"MongoDBConnection": "mongodb://username:password@mongodb:27017"
```

**Recommendation**: Provide real connection strings via:
- User Secrets for development
- Environment variables for production (as already done for `MONGO_CONNECTION_STRING` in Program.cs)
- Connection string should be retrieved via: `Environment.GetEnvironmentVariable("CONNECTION_STRING_NAME")`

### 4. MongoDB Settings (✅ Placeholders)

**Location**: `appsettings.json` > `MongoDbSettings`

```json
{
  "MongoDbSettings": {
    "ConnectionString": "mongodb://username:password@mongodb:27017",
    "DatabaseName": "MongoDb"
  }
}
```
  "MongoDbSettings": {
    "ConnectionString": "mongodb://username:password@mongodb:27017",
    "DatabaseName": "MongoDb"
  }
}
```

**Note**: The application already reads MongoDB connection from environment variable `MONGO_CONNECTION_STRING` in `Program.cs`. The appsettings.json now contains placeholder credentials.

## Best Practices

### For Development

1. **Use User Secrets**: 
   ```bash
   dotnet user-secrets init
   dotnet user-secrets set "EmailSettings:SmtpPassword" "your-password"
   dotnet user-secrets set "Google:ClientSecret" "your-secret"
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-connection-string"
   ```

2. **Update appsettings.json**: Remove sensitive values and use placeholders
   ```json
   {
     "EmailSettings": {
       "SmtpPassword": ""
     },
     "Google": {
       "ClientSecret": ""
     }
   }
   ```

### For Production

1. **Environment Variables**: Set all sensitive configuration as environment variables
   ```bash
   export EmailSettings__SmtpPassword="your-password"
   export Google__ClientSecret="your-secret"
   export ConnectionStrings__DefaultConnection="your-connection-string"
   ```

2. **Secret Management Services**:
   - Azure Key Vault
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets

3. **Never commit**:
   - Passwords
   - API keys
   - Connection strings with credentials
   - OAuth secrets
   
   to version control.

## See Also

- [.env.example](/.env.example) - Template for environment variable configuration
- [Safe storage of app secrets in development in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [Configuration in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
