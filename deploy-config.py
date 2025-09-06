#!/usr/bin/env python3
"""
Wildblood.Tactics Deployment Configuration Automation

This script generates secure passwords and updates all configuration files
for production deployment of the Wildblood.Tactics application.
"""

import json
import re
import secrets
import string
import sys
from pathlib import Path
from datetime import datetime

def generate_password(length=16):
    """Generate a secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def update_docker_compose(file_path, mongo_username, mongo_password, sql_password):
    """Update docker-compose.yml with new configuration."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Update MONGO_CONNECTION_STRING
    content = re.sub(
        r'MONGO_CONNECTION_STRING=mongodb://admin:password@mongodb:27017',
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
        r'SA_PASSWORD: "DeinStarkesPasswort123!"',
        f'SA_PASSWORD: "{sql_password}"',
        content
    )
    
    # Update MONGO_INITDB_ROOT_USERNAME
    content = re.sub(
        r'MONGO_INITDB_ROOT_USERNAME: admin',
        f'MONGO_INITDB_ROOT_USERNAME: {mongo_username}',
        content
    )
    
    # Update MONGO_INITDB_ROOT_PASSWORD
    content = re.sub(
        r'MONGO_INITDB_ROOT_PASSWORD: password',
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
    # Parse command line arguments
    domain = sys.argv[1] if len(sys.argv) > 1 else "https://Wildblood-Tactics.de"
    mongo_username = sys.argv[2] if len(sys.argv) > 2 else "wildblood"
    
    # Ensure domain has https:// prefix
    if not domain.startswith('http'):
        domain = f"https://{domain}"
    
    print("🚀 Wildblood.Tactics Deployment Configuration Automation")
    print("=====================================================")
    
    # Generate secure passwords
    mongo_password = generate_password(20)
    sql_password = generate_password(20)
    
    print("✅ Generated secure passwords")
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
    print(f"MongoDB Password: {mongo_password}")
    print(f"SQL Password: {sql_password}")
    print(f"Domain: {domain}")
    print(f"Hub URL: {domain}/tacticshub")
    
    # Save configuration to file for reference
    config_summary = {
        "MongoDB": {
            "Username": mongo_username,
            "Password": mongo_password
        },
        "SQL": {
            "Password": sql_password
        },
        "Domain": domain,
        "HubURL": f"{domain}/tacticshub",
        "GeneratedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open("./deployment-config.json", "w") as f:
        json.dump(config_summary, f, indent=2)
    
    print("🎉 Deployment configuration completed successfully!")
    print("📄 Configuration saved to: deployment-config.json")
    print("⚠️  Please save the passwords securely and delete deployment-config.json after noting them!")
    print("")
    print(f"Usage: {sys.argv[0]} [domain] [mongo_username]")
    print(f"Example: {sys.argv[0]} my-domain.com myuser")

if __name__ == "__main__":
    main()