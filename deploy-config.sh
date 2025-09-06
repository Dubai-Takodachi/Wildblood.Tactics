#!/bin/bash

# Wildblood.Tactics Deployment Configuration Automation
# This script generates secure passwords and updates all configuration files
# for production deployment of the Wildblood.Tactics application.

# Default values
DOMAIN=${1:-"Wildblood-Tactics.de"}
MONGO_USERNAME=${2:-"wildblood"}

# Function to generate secure password
generate_password() {
    local length=${1:-16}
    LC_ALL=C tr -dc 'a-zA-Z0-9!@#$%^&*' < /dev/urandom | head -c "$length"
}

echo "🚀 Wildblood.Tactics Deployment Configuration Automation"
echo "====================================================="

# Generate secure passwords
MONGO_PASSWORD=$(generate_password 20)
SQL_PASSWORD=$(generate_password 20)

echo "✅ Generated secure passwords"
echo "📝 MongoDB Username: $MONGO_USERNAME"
echo "📝 Domain: $DOMAIN"

# 1. Update docker-compose.yml
echo "🔧 Updating docker-compose.yml..."

DOCKER_COMPOSE_PATH="./docker-compose.yml"
if [ -f "$DOCKER_COMPOSE_PATH" ]; then
    # Create backup
    cp "$DOCKER_COMPOSE_PATH" "$DOCKER_COMPOSE_PATH.backup"
    
    # Update MONGO_CONNECTION_STRING
    sed -i "s|MONGO_CONNECTION_STRING=mongodb://admin:password@mongodb:27017|MONGO_CONNECTION_STRING=mongodb://$MONGO_USERNAME:$MONGO_PASSWORD@mongodb:27017|g" "$DOCKER_COMPOSE_PATH"
    
    # Remove https://+:8081 from ASPNETCORE_URLS  
    sed -i 's|ASPNETCORE_URLS=http://+:8080;https://+:8081|ASPNETCORE_URLS=http://+:8080|g' "$DOCKER_COMPOSE_PATH"
    
    # Update SA_PASSWORD - need to escape special characters
    ESCAPED_SQL_PASSWORD=$(printf '%s\n' "$SQL_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|SA_PASSWORD: \"DeinStarkesPasswort123!\"|SA_PASSWORD: \"$ESCAPED_SQL_PASSWORD\"|g" "$DOCKER_COMPOSE_PATH"
    
    # Update MONGO_INITDB_ROOT_USERNAME
    sed -i "s|MONGO_INITDB_ROOT_USERNAME: admin|MONGO_INITDB_ROOT_USERNAME: $MONGO_USERNAME|g" "$DOCKER_COMPOSE_PATH"
    
    # Update MONGO_INITDB_ROOT_PASSWORD - need to escape special characters
    ESCAPED_MONGO_PASSWORD=$(printf '%s\n' "$MONGO_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|MONGO_INITDB_ROOT_PASSWORD: password|MONGO_INITDB_ROOT_PASSWORD: $ESCAPED_MONGO_PASSWORD|g" "$DOCKER_COMPOSE_PATH"
    
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
    sed -i "s|Server=mssql,1433;Database=master;User Id=sa;Password=DeinStarkesPasswort123!;Encrypt=False;|Server=mssql_container,1433;Database=master;User Id=sa;Password=$ESCAPED_SQL_PASSWORD;Encrypt=False;|g" "$APPSETTINGS_PATH"
    
    # Update MongoDBConnection - need to escape special characters  
    ESCAPED_MONGO_PASSWORD=$(printf '%s\n' "$MONGO_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|mongodb://admin:password@mongodb:27017|mongodb://$MONGO_USERNAME:$ESCAPED_MONGO_PASSWORD@mongodb:27017|g" "$APPSETTINGS_PATH"
    
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
echo "MongoDB Password: $MONGO_PASSWORD"
echo "SQL Password: $SQL_PASSWORD"
echo "Domain: $DOMAIN"
echo "Hub URL: https://$DOMAIN/tacticshub"

# Save configuration to file for reference
cat > ./deployment-config.json << EOF
{
  "MongoDB": {
    "Username": "$MONGO_USERNAME",
    "Password": "$MONGO_PASSWORD"
  },
  "SQL": {
    "Password": "$SQL_PASSWORD"
  },
  "Domain": "$DOMAIN",
  "HubURL": "https://$DOMAIN/tacticshub",
  "GeneratedAt": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF

echo "🎉 Deployment configuration completed successfully!"
echo "📄 Configuration saved to: deployment-config.json"
echo "⚠️  Please save the passwords securely and delete deployment-config.json after noting them!"
echo ""
echo "Usage: $0 [domain] [mongo_username]"
echo "Example: $0 my-domain.com myuser"