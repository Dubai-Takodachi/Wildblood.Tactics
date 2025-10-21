#!/bin/bash

# Wildblood.Tactics Deployment Configuration Automation
# This script reads configuration from a .env file and updates all configuration files
# for production deployment of the Wildblood.Tactics application.

# Function to load environment variables from .env file
load_env_file() {
    local env_file="${1:-.env}"
    
    if [ ! -f "$env_file" ]; then
        echo "❌ Environment file '$env_file' not found!"
        echo "💡 Copy .env.example to .env and configure your credentials"
        exit 1
    fi
    
    # Read the .env file and export variables
    set -a  # Automatically export all variables
    source "$env_file"
    set +a  # Turn off automatic export
}

# Function to validate required environment variables
validate_env_vars() {
    local missing_vars=()
    
    [ -z "$DOMAIN" ] && missing_vars+=("DOMAIN")
    [ -z "$MONGO_USERNAME" ] && missing_vars+=("MONGO_USERNAME")
    [ -z "$MONGO_PASSWORD" ] && missing_vars+=("MONGO_PASSWORD")
    [ -z "$SQL_PASSWORD" ] && missing_vars+=("SQL_PASSWORD")
    [ -z "$EMAIL_SMTP_SERVER" ] && missing_vars+=("EMAIL_SMTP_SERVER")
    [ -z "$EMAIL_SMTP_PORT" ] && missing_vars+=("EMAIL_SMTP_PORT")
    [ -z "$EMAIL_SMTP_USER" ] && missing_vars+=("EMAIL_SMTP_USER")
    [ -z "$EMAIL_SMTP_PASSWORD" ] && missing_vars+=("EMAIL_SMTP_PASSWORD")
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Missing required environment variables: ${missing_vars[*]}"
        echo "💡 Check your .env file and ensure all required variables are set"
        exit 1
    fi
}

# Function to generate secure password (keeping for backward compatibility)
generate_password() {
    local length=${1:-16}
    # Use alphanumeric + safe special characters that don't interfere with shell/env parsing
    LC_ALL=C tr -dc 'a-zA-Z0-9!@$%*+=?-_' < /dev/urandom | head -c "$length"
}

echo "🚀 Wildblood.Tactics Deployment Configuration Automation"
echo "====================================================="

# Load environment variables from .env file
load_env_file
validate_env_vars

echo "📁 Reading configuration from .env file"
echo "📝 MongoDB Username: $MONGO_USERNAME"
echo "📝 Domain: $DOMAIN"

# 1. Update docker-compose.yml
echo "🔧 Updating docker-compose.yml..."

DOCKER_COMPOSE_PATH="./docker-compose.yml"
if [ -f "$DOCKER_COMPOSE_PATH" ]; then
    # Create backup
    cp "$DOCKER_COMPOSE_PATH" "$DOCKER_COMPOSE_PATH.backup"
    
    # Update MONGO_CONNECTION_STRING
    sed -i "s|MONGO_CONNECTION_STRING=mongodb://testuser:TestMongo123!@mongodb:27017|MONGO_CONNECTION_STRING=mongodb://$MONGO_USERNAME:$MONGO_PASSWORD@mongodb:27017|g" "$DOCKER_COMPOSE_PATH"
    
    # Remove https://+:8081 from ASPNETCORE_URLS  
    sed -i 's|ASPNETCORE_URLS=http://+:8080;https://+:8081|ASPNETCORE_URLS=http://+:8080|g' "$DOCKER_COMPOSE_PATH"
    
    # Update SA_PASSWORD - need to escape special characters
    ESCAPED_SQL_PASSWORD=$(printf '%s\n' "$SQL_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|SA_PASSWORD: \"TestSQL456!\"|SA_PASSWORD: \"$ESCAPED_SQL_PASSWORD\"|g" "$DOCKER_COMPOSE_PATH"
    
    # Update MONGO_INITDB_ROOT_USERNAME
    sed -i "s|MONGO_INITDB_ROOT_USERNAME: testuser|MONGO_INITDB_ROOT_USERNAME: $MONGO_USERNAME|g" "$DOCKER_COMPOSE_PATH"
    
    # Update MONGO_INITDB_ROOT_PASSWORD - need to escape special characters
    ESCAPED_MONGO_PASSWORD=$(printf '%s\n' "$MONGO_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|MONGO_INITDB_ROOT_PASSWORD: TestMongo123!|MONGO_INITDB_ROOT_PASSWORD: $ESCAPED_MONGO_PASSWORD|g" "$DOCKER_COMPOSE_PATH"
    
    echo "   ✅ docker-compose.yml updated"
else
    echo "   ❌ docker-compose.yml not found!"
    exit 1
fi

# 2. Update appsettings.json
echo "🔧 Updating appsettings.json..."

APPSETTINGS_PATH="./Wildblood.Tactics/Wildblood.Tactics/appsettings.json"
if [ -f "$APPSETTINGS_PATH" ]; then
    # Create backup
    cp "$APPSETTINGS_PATH" "$APPSETTINGS_PATH.backup"
    
    # Update DefaultConnection - change server and password, need to escape special characters
    ESCAPED_SQL_PASSWORD=$(printf '%s\n' "$SQL_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|Server=mssql,1433;Database=master;User Id=sa;Password=TestSQL456!;Encrypt=False;|Server=mssql_container,1433;Database=master;User Id=sa;Password=$ESCAPED_SQL_PASSWORD;Encrypt=False;|g" "$APPSETTINGS_PATH"
    
    # Update MongoDBConnection - need to escape special characters  
    ESCAPED_MONGO_PASSWORD=$(printf '%s\n' "$MONGO_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|mongodb://testuser:TestMongo123!@mongodb:27017|mongodb://$MONGO_USERNAME:$ESCAPED_MONGO_PASSWORD@mongodb:27017|g" "$APPSETTINGS_PATH"
    
    # Update EmailSettings - need to escape special characters
    ESCAPED_EMAIL_PASSWORD=$(printf '%s\n' "$EMAIL_SMTP_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    ESCAPED_EMAIL_USER=$(printf '%s\n' "$EMAIL_SMTP_USER" | sed 's/[[\.*^$()+?{|]/\\&/g')
    ESCAPED_EMAIL_SERVER=$(printf '%s\n' "$EMAIL_SMTP_SERVER" | sed 's/[[\.*^$()+?{|]/\\&/g')
    ESCAPED_FROM_NAME=$(printf '%s\n' "${EMAIL_FROM_NAME:-Wildblood Tactics}" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    sed -i "s|\"SmtpServer\": \"[^\"]*\"|\"SmtpServer\": \"$ESCAPED_EMAIL_SERVER\"|g" "$APPSETTINGS_PATH"
    sed -i "s|\"SmtpPort\": [0-9]*|\"SmtpPort\": $EMAIL_SMTP_PORT|g" "$APPSETTINGS_PATH"
    sed -i "s|\"SmtpUser\": \"[^\"]*\"|\"SmtpUser\": \"$ESCAPED_EMAIL_USER\"|g" "$APPSETTINGS_PATH"
    sed -i "s|\"SmtpPassword\": \"[^\"]*\"|\"SmtpPassword\": \"$ESCAPED_EMAIL_PASSWORD\"|g" "$APPSETTINGS_PATH"
    sed -i "s|\"FromName\": \"[^\"]*\"|\"FromName\": \"$ESCAPED_FROM_NAME\"|g" "$APPSETTINGS_PATH"
    
    echo "   ✅ appsettings.json updated"
else
    echo "   ❌ appsettings.json not found!"
    exit 1
fi

# 3. Update HubConnectionService.cs
echo "🔧 Updating HubConnectionService.cs..."

HUB_SERVICE_PATH="./Wildblood.Tactics/Wildblood.Tactics/Services/HubConnectionService.cs"
if [ -f "$HUB_SERVICE_PATH" ]; then
    # Create backup
    cp "$HUB_SERVICE_PATH" "$HUB_SERVICE_PATH.backup"
    
    # Update HubConnectionBuilder.WithUrl
    sed -i "s|navigationManager.ToAbsoluteUri(\"/tacticsHub\")|\"https://$DOMAIN/tacticshub\"|g" "$HUB_SERVICE_PATH"
    
    echo "   ✅ HubConnectionService.cs updated"
else
    echo "   ❌ HubConnectionService.cs not found!"
    exit 1
fi

# Create configuration summary
echo "📋 Configuration Summary"
echo "========================"
echo "MongoDB Username: $MONGO_USERNAME"
echo "MongoDB Password: [HIDDEN]"
echo "SQL Password: [HIDDEN]"
echo "Email SMTP Server: $EMAIL_SMTP_SERVER"
echo "Email SMTP Port: $EMAIL_SMTP_PORT"
echo "Email SMTP User: $EMAIL_SMTP_USER"
echo "Email SMTP Password: [HIDDEN]"
echo "Email From Name: ${EMAIL_FROM_NAME:-Wildblood Tactics}"
echo "Domain: $DOMAIN"
echo "Hub URL: https://$DOMAIN/tacticshub"

# Save configuration to file for reference (without passwords)
cat > ./deployment-config.json << EOF
{
  "MongoDB": {
    "Username": "$MONGO_USERNAME",
    "Password": "[HIDDEN - Check .env file]"
  },
  "SQL": {
    "Password": "[HIDDEN - Check .env file]"
  },
  "Email": {
    "SmtpServer": "$EMAIL_SMTP_SERVER",
    "SmtpPort": $EMAIL_SMTP_PORT,
    "SmtpUser": "$EMAIL_SMTP_USER",
    "SmtpPassword": "[HIDDEN - Check .env file]",
    "FromName": "${EMAIL_FROM_NAME:-Wildblood Tactics}"
  },
  "Domain": "$DOMAIN",
  "HubURL": "https://$DOMAIN/tacticshub",
  "GeneratedAt": "$(date '+%Y-%m-%d %H:%M:%S')",
  "ConfigurationSource": ".env file"
}
EOF

echo "🎉 Deployment configuration completed successfully!"
echo "📄 Configuration summary saved to: deployment-config.json"
echo "💡 Configuration read from: .env file"
echo ""
echo "Usage: $0"
echo "Note: This script now reads configuration from .env file instead of command line arguments"