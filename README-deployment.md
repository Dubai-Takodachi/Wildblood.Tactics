# Wildblood.Tactics Deployment Configuration Automation

This directory contains automation scripts to configure the Wildblood.Tactics application for production deployment. The scripts read configuration from a `.env` file and update all necessary configuration files.

## 🎯 What it does

The automation scripts perform the following configuration changes for production deployment:

### docker-compose.yml changes:
- ✅ Changes `MONGO_CONNECTION_STRING` to use credentials from .env file
- ✅ Removes `https://+:8081` from `ASPNETCORE_URLS` (keeps only `http://+:8080`)
- ✅ Changes `SA_PASSWORD` to the password specified in .env file
- ✅ Changes `MONGO_INITDB_ROOT_USERNAME` to the username specified in .env file
- ✅ Changes `MONGO_INITDB_ROOT_PASSWORD` to the password specified in .env file

### appsettings.json changes:
- ✅ Updates `DefaultConnection` server to `mssql_container` and sets password from .env file
- ✅ Updates `MongoDBConnection` with username and password from .env file
- ✅ Updates `MongoDbSettings.ConnectionString` with matching credentials from .env file

### HubConnectionService.cs changes:
- ✅ Changes `HubConnectionBuilder.WithUrl` to production URL using domain from .env file

## 🔧 Setup

### 1. Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your production values
nano .env
```

The `.env` file should contain:
```bash
# Domain Configuration
DOMAIN=your-domain.com

# MongoDB Configuration
MONGO_USERNAME=your_mongo_username
MONGO_PASSWORD=your_secure_mongo_password

# SQL Server Configuration  
SQL_PASSWORD=your_secure_sql_password
```

## 🚀 Available Scripts

All scripts now read configuration from a `.env` file instead of using command-line arguments or generating random passwords.

### 1. Python Script (Recommended)
```bash
python3 deploy-config.py
```

### 2. Bash Script
```bash
./deploy-config.sh
```

### 3. PowerShell Script
```powershell
./deploy-config.ps1
```

## 🔒 Security Features

- **External Credential Management**: Uses `.env` file to separate configuration from code
- **No Hardcoded Secrets**: All sensitive credentials are read from environment file
- **Automatic Backups**: Creates `.backup` files before making changes
- **Password Privacy**: Deployment summary hides passwords for security
- **Configuration Logging**: Saves deployment configuration summary to `deployment-config.json`

## 📋 Output

After running the script, you'll get:

1. **Console Output**: Summary of all changes made (passwords are hidden)
2. **deployment-config.json**: Contains configuration summary without sensitive passwords
3. **Backup Files**: Original files are backed up with `.backup` extension

## ⚠️ Important Security Notes

1. **Environment File Security**: Keep your `.env` file secure and never commit it to version control
2. **Copy Example File**: Use `.env.example` as a template for your `.env` file
3. **Strong Passwords**: Use strong, unique passwords in your `.env` file
4. **Backup Files**: The `.backup` files contain the original configuration - keep them safe
5. **File Permissions**: Ensure your `.env` file has appropriate permissions (600 or 644)

## 🔄 Reverting Changes

If you need to revert the changes:

```bash
# Restore from backups
cp docker-compose.yml.backup docker-compose.yml
cp Wildblood.Tactics/Wildblood.Tactics/appsettings.json.backup Wildblood.Tactics/Wildblood.Tactics/appsettings.json
cp Wildblood.Tactics/Wildblood.Tactics/Services/HubConnectionService.cs.backup Wildblood.Tactics/Wildblood.Tactics/Services/HubConnectionService.cs
```

## 📁 File Structure

```
.
├── .env.example                    # Template environment file
├── .env                           # Your production environment file (create from example)
├── deploy-config.py               # Python automation script (recommended)
├── deploy-config.sh               # Bash automation script
├── deploy-config.ps1              # PowerShell automation script
├── deployment-config.json         # Generated configuration summary (no passwords)
├── docker-compose.yml             # Updated Docker configuration
├── docker-compose.yml.backup      # Original backup
├── Wildblood.Tactics/
│   └── Wildblood.Tactics/
│       ├── appsettings.json           # Updated app settings
│       ├── appsettings.json.backup    # Original backup
│       └── Services/
│           ├── HubConnectionService.cs         # Updated service
│           └── HubConnectionService.cs.backup  # Original backup
└── README-deployment.md           # This documentation
```

## 🐳 Docker Deployment

After running the automation script, you can deploy with:

```bash
docker-compose up -d
```

The application will be configured with:
- Secure database passwords
- Correct container networking
- Production-ready SignalR hub URL
- MongoDB with custom credentials

## 🔧 Manual Configuration

If you prefer manual configuration, the automation scripts show you exactly which values need to be changed. Check the script source code for the specific replacements being made. All scripts now read from the `.env` file to get the credentials to use.