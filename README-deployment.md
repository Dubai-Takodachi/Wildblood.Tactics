# Wildblood.Tactics Deployment Configuration Automation

This directory contains automation scripts to configure the Wildblood.Tactics application for production deployment. The scripts automatically generate secure passwords and update all necessary configuration files.

## 🎯 What it does

The automation scripts perform the following configuration changes for production deployment:

### docker-compose.yml changes:
- ✅ Changes `MONGO_CONNECTION_STRING` to use a new secure password
- ✅ Removes `https://+:8081` from `ASPNETCORE_URLS` (keeps only `http://+:8080`)
- ✅ Changes `SA_PASSWORD` to a secure randomly generated password
- ✅ Changes `MONGO_INITDB_ROOT_USERNAME` to `wildblood`
- ✅ Changes `MONGO_INITDB_ROOT_PASSWORD` to a secure randomly generated password

### appsettings.json changes:
- ✅ Updates `DefaultConnection` server to `mssql_container` and sets secure password
- ✅ Updates `MongoDBConnection` with `wildblood` username and secure password
- ✅ Updates `MongoDbSettings.ConnectionString` with matching credentials

### HubConnectionService.cs changes:
- ✅ Changes `HubConnectionBuilder.WithUrl` to production URL `https://Wildblood-Tactics.de/tacticshub`

## 🚀 Available Scripts

### 1. Python Script (Recommended)
```bash
python3 deploy-config.py [domain] [mongo_username]
```

**Examples:**
```bash
# Use defaults (https://Wildblood-Tactics.de, wildblood)
python3 deploy-config.py

# Custom domain
python3 deploy-config.py my-domain.com

# Custom domain and username
python3 deploy-config.py my-domain.com myuser
```

### 2. Bash Script
```bash
./deploy-config.sh [domain] [mongo_username]
```

**Examples:**
```bash
# Use defaults (Wildblood-Tactics.de, wildblood)
./deploy-config.sh

# Custom domain
./deploy-config.sh my-domain.com

# Custom domain and username
./deploy-config.sh my-domain.com myuser
```

### 3. PowerShell Script
```powershell
./deploy-config.ps1 -Domain "my-domain.com" -MongoUsername "myuser"
```

## 🔒 Security Features

- **Secure Password Generation**: Uses cryptographically secure random generators
- **Automatic Backups**: Creates `.backup` files before making changes
- **Password Complexity**: Generates 20-character passwords with mixed character sets
- **Configuration Logging**: Saves deployment configuration to `deployment-config.json`

## 📋 Output

After running the script, you'll get:

1. **Console Output**: Summary of all changes made
2. **deployment-config.json**: Contains all generated passwords and configuration details
3. **Backup Files**: Original files are backed up with `.backup` extension

## ⚠️ Important Security Notes

1. **Save Passwords Securely**: Copy the generated passwords to your password manager
2. **Delete Config File**: Remove `deployment-config.json` after noting the passwords
3. **Backup Files**: The `.backup` files contain the original configuration - keep them safe
4. **Environment Variables**: Consider using environment variables for sensitive data in production

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
├── deploy-config.py              # Python automation script (recommended)
├── deploy-config.sh              # Bash automation script
├── deploy-config.ps1             # PowerShell automation script
├── deployment-config.json        # Generated configuration summary
├── docker-compose.yml            # Updated Docker configuration
├── docker-compose.yml.backup     # Original backup
├── Wildblood.Tactics/
│   └── Wildblood.Tactics/
│       ├── appsettings.json           # Updated app settings
│       ├── appsettings.json.backup    # Original backup
│       └── Services/
│           ├── HubConnectionService.cs         # Updated service
│           └── HubConnectionService.cs.backup  # Original backup
└── README-deployment.md          # This documentation
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

If you prefer manual configuration, the automation scripts show you exactly which values need to be changed. Check the script source code for the specific replacements being made.