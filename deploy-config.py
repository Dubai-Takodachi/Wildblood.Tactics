#!/usr/bin/env python3
"""
Wildblood.Tactics Deployment Configuration Automation

This script reads configuration from a .env file and updates all configuration files
for production deployment of the Wildblood.Tactics application.
"""

import json
import re
import secrets
import string
import sys
import os
from pathlib import Path
from datetime import datetime

def load_env_file(env_path=".env"):
    """Load environment variables from .env file."""
    env_vars = {}
    if not os.path.exists(env_path):
        print(f"❌ Environment file '{env_path}' not found!")
        print("💡 Copy .env.example to .env and configure your credentials")
        sys.exit(1)
    
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    return env_vars

def validate_env_vars(env_vars):
    """Validate that all required environment variables are present."""
    required_vars = ['DOMAIN', 'MONGO_USERNAME', 'MONGO_PASSWORD', 'SQL_PASSWORD']
    missing_vars = [var for var in required_vars if not env_vars.get(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("💡 Check your .env file and ensure all required variables are set")
        sys.exit(1)
    
    return True

def generate_password(length=16):
    """Generate a secure password without special characters that cause issues in environment variables."""
    # Use alphanumeric + safe special characters that don't interfere with shell/env parsing
    alphabet = string.ascii_letters + string.digits + "!@$%*+=?-_"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def update_docker_compose(file_path, mongo_username, mongo_password, sql_password):
    """Update docker-compose.yml with new configuration."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Update MONGO_CONNECTION_STRING
    content = re.sub(
        r'MONGO_CONNECTION_STRING=mongodb://testuser:TestMongo123!@mongodb:27017',
        f'MONGO_CONNECTION_STRING=mongodb://{mongo_username}:{mongo_password}@mongodb:27017',
        content
    )
    
    # Remove https://+:8081 from ASPNETCORE_URLS
    content = re.sub(
        r'ASPNETCORE_URLS=http://\+:8080;https://\+:8081',
        'ASPNETCORE_URLS=http://+:8080',
        content
    )
    
    # Update SA_PASSWORD
    content = re.sub(
        r'SA_PASSWORD: "TestSQL456!"',
        f'SA_PASSWORD: "{sql_password}"',
        content
    )
    
    # Update MONGO_INITDB_ROOT_USERNAME
    content = re.sub(
        r'MONGO_INITDB_ROOT_USERNAME: testuser',
        f'MONGO_INITDB_ROOT_USERNAME: {mongo_username}',
        content
    )
    
    # Update MONGO_INITDB_ROOT_PASSWORD
    content = re.sub(
        r'MONGO_INITDB_ROOT_PASSWORD: TestMongo123!',
        f'MONGO_INITDB_ROOT_PASSWORD: {mongo_password}',
        content
    )
    
    with open(file_path, 'w') as f:
        f.write(content)

def update_appsettings(file_path, mongo_username, mongo_password, sql_password):
    """Update appsettings.json with new configuration."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Update DefaultConnection
    data['ConnectionStrings']['DefaultConnection'] = f'Server=mssql_container,1433;Database=master;User Id=sa;Password={sql_password};Encrypt=False;'
    
    # Update MongoDBConnection
    data['ConnectionStrings']['MongoDBConnection'] = f'mongodb://{mongo_username}:{mongo_password}@mongodb:27017'
    
    # Update MongoDbSettings.ConnectionString
    data['MongoDbSettings']['ConnectionString'] = f'mongodb://{mongo_username}:{mongo_password}@mongodb:27017'
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def update_hub_service(file_path, domain):
    """Update HubConnectionService.cs with production URL."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Update HubConnectionBuilder.WithUrl
    content = re.sub(
        r'navigationManager\.ToAbsoluteUri\("/tacticsHub"\)',
        f'"{domain}/tacticshub"',
        content
    )
    
    with open(file_path, 'w') as f:
        f.write(content)

def main():
    # Load environment variables from .env file
    env_vars = load_env_file()
    validate_env_vars(env_vars)
    
    # Get configuration from environment variables
    domain = env_vars['DOMAIN']
    mongo_username = env_vars['MONGO_USERNAME']
    mongo_password = env_vars['MONGO_PASSWORD']
    sql_password = env_vars['SQL_PASSWORD']
    
    # Ensure domain has https:// prefix
    if not domain.startswith('http'):
        domain = f"https://{domain}"
    
    print("🚀 Wildblood.Tactics Deployment Configuration Automation")
    print("=====================================================")
    print("📁 Reading configuration from .env file")
    print(f"📝 MongoDB Username: {mongo_username}")
    print(f"📝 Domain: {domain}")
    
    # File paths
    docker_compose_path = Path("./docker-compose.yml")
    appsettings_path = Path("./Wildblood.Tactics/Wildblood.Tactics/appsettings.json")
    hub_service_path = Path("./Wildblood.Tactics/Wildblood.Tactics/Services/HubConnectionService.cs")
    
    # 1. Update docker-compose.yml
    print("🔧 Updating docker-compose.yml...")
    if docker_compose_path.exists():
        # Create backup
        docker_compose_path.with_suffix('.yml.backup').write_text(docker_compose_path.read_text())
        update_docker_compose(docker_compose_path, mongo_username, mongo_password, sql_password)
        print("   ✅ docker-compose.yml updated")
    else:
        print("   ❌ docker-compose.yml not found!")
        sys.exit(1)
    
    # 2. Update appsettings.json
    print("🔧 Updating appsettings.json...")
    if appsettings_path.exists():
        # Create backup
        appsettings_path.with_suffix('.json.backup').write_text(appsettings_path.read_text())
        update_appsettings(appsettings_path, mongo_username, mongo_password, sql_password)
        print("   ✅ appsettings.json updated")
    else:
        print("   ❌ appsettings.json not found!")
        sys.exit(1)
    
    # 3. Update HubConnectionService.cs
    print("🔧 Updating HubConnectionService.cs...")
    if hub_service_path.exists():
        # Create backup
        hub_service_path.with_suffix('.cs.backup').write_text(hub_service_path.read_text())
        update_hub_service(hub_service_path, domain)
        print("   ✅ HubConnectionService.cs updated")
    else:
        print("   ❌ HubConnectionService.cs not found!")
        sys.exit(1)
    
    # Create configuration summary
    print("📋 Configuration Summary")
    print("========================")
    print(f"MongoDB Username: {mongo_username}")
    print(f"MongoDB Password: [HIDDEN]")
    print(f"SQL Password: [HIDDEN]")
    print(f"Domain: {domain}")
    print(f"Hub URL: {domain}/tacticshub")
    
    # Save configuration to file for reference (without passwords)
    config_summary = {
        "MongoDB": {
            "Username": mongo_username,
            "Password": "[HIDDEN - Check .env file]"
        },
        "SQL": {
            "Password": "[HIDDEN - Check .env file]"
        },
        "Domain": domain,
        "HubURL": f"{domain}/tacticshub",
        "GeneratedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ConfigurationSource": ".env file"
    }
    
    with open("./deployment-config.json", "w") as f:
        json.dump(config_summary, f, indent=2)
    
    print("🎉 Deployment configuration completed successfully!")
    print("📄 Configuration summary saved to: deployment-config.json")
    print("💡 Configuration read from: .env file")
    print("")
    print("Usage: python3 deploy-config.py")
    print("Note: This script now reads configuration from .env file instead of command line arguments")

if __name__ == "__main__":
    main()