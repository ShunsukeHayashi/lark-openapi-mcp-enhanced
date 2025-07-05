#!/bin/bash

# Secure Environment Setup Script for Lark OpenAPI MCP
# This script helps set up secure environment variable management

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ENV_TEMPLATE="$PROJECT_DIR/.env.secure.template"
LARK_MCP_DIR="$HOME/.lark-mcp"
CREDENTIALS_FILE="$LARK_MCP_DIR/secure-credentials.json"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to generate secure random key
generate_encryption_key() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import secrets; print(secrets.token_hex(32))"
    else
        # Fallback to /dev/urandom
        head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n'
    fi
}

# Function to check file permissions
check_file_permissions() {
    local file="$1"
    local expected_perm="$2"
    
    if [[ -f "$file" ]]; then
        local actual_perm=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
        if [[ "$actual_perm" != "$expected_perm" ]]; then
            print_warning "File $file has permissions $actual_perm, expected $expected_perm"
            return 1
        fi
    fi
    return 0
}

# Function to set secure file permissions
set_secure_permissions() {
    local file="$1"
    local perm="$2"
    
    if [[ -f "$file" ]]; then
        chmod "$perm" "$file"
        print_status "Set permissions $perm on $file"
    fi
}

# Function to create secure directory
create_secure_directory() {
    local dir="$1"
    
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
        chmod 700 "$dir"
        print_status "Created secure directory: $dir"
    else
        chmod 700 "$dir"
        print_status "Secured existing directory: $dir"
    fi
}

# Function to setup macOS Keychain integration
setup_macos_keychain() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_header "macOS Keychain Integration Setup"
        
        echo "Do you want to store credentials in macOS Keychain? (y/n)"
        read -r use_keychain
        
        if [[ "$use_keychain" =~ ^[Yy]$ ]]; then
            echo "Enter your Lark App ID:"
            read -r app_id
            echo "Enter your Lark App Secret:"
            read -rs app_secret
            
            # Store in keychain
            security add-generic-password -a "lark-mcp" -s "lark-app-id" -w "$app_id" -U 2>/dev/null || \
            security add-generic-password -a "lark-mcp" -s "lark-app-id" -w "$app_id"
            
            security add-generic-password -a "lark-mcp" -s "lark-app-secret" -w "$app_secret" -U 2>/dev/null || \
            security add-generic-password -a "lark-mcp" -s "lark-app-secret" -w "$app_secret"
            
            print_status "Credentials stored in macOS Keychain"
            
            # Create helper script
            cat > "$PROJECT_DIR/scripts/load-keychain-env.sh" << 'EOF'
#!/bin/bash
# Load credentials from macOS Keychain
export LARK_APP_ID=$(security find-generic-password -a "lark-mcp" -s "lark-app-id" -w)
export LARK_APP_SECRET=$(security find-generic-password -a "lark-mcp" -s "lark-app-secret" -w)
EOF
            chmod +x "$PROJECT_DIR/scripts/load-keychain-env.sh"
            print_status "Created keychain loader script: scripts/load-keychain-env.sh"
        fi
    fi
}

# Function to setup Linux secret service
setup_linux_secrets() {
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v secret-tool >/dev/null 2>&1; then
        print_header "Linux Secret Service Setup"
        
        echo "Do you want to store credentials in GNOME Keyring? (y/n)"
        read -r use_keyring
        
        if [[ "$use_keyring" =~ ^[Yy]$ ]]; then
            echo "Enter your Lark App ID:"
            read -r app_id
            echo "Enter your Lark App Secret:"
            read -rs app_secret
            
            # Store in secret service
            echo "$app_id" | secret-tool store --label="Lark App ID" service lark-mcp username app-id
            echo "$app_secret" | secret-tool store --label="Lark App Secret" service lark-mcp username app-secret
            
            print_status "Credentials stored in GNOME Keyring"
            
            # Create helper script
            cat > "$PROJECT_DIR/scripts/load-secrets-env.sh" << 'EOF'
#!/bin/bash
# Load credentials from Linux Secret Service
export LARK_APP_ID=$(secret-tool lookup service lark-mcp username app-id)
export LARK_APP_SECRET=$(secret-tool lookup service lark-mcp username app-secret)
EOF
            chmod +x "$PROJECT_DIR/scripts/load-secrets-env.sh"
            print_status "Created secret service loader script: scripts/load-secrets-env.sh"
        fi
    fi
}

# Function to create .env file from template
create_env_file() {
    print_header "Environment File Setup"
    
    if [[ -f "$ENV_FILE" ]]; then
        print_warning ".env file already exists"
        echo "Do you want to overwrite it? (y/n)"
        read -r overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            print_status "Keeping existing .env file"
            return
        fi
    fi
    
    if [[ ! -f "$ENV_TEMPLATE" ]]; then
        print_error "Template file not found: $ENV_TEMPLATE"
        return 1
    fi
    
    # Copy template
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    
    # Generate encryption key
    local encryption_key
    encryption_key=$(generate_encryption_key)
    
    # Replace placeholder with generated key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your_64_character_hex_encryption_key_here/$encryption_key/g" "$ENV_FILE"
    else
        sed -i "s/your_64_character_hex_encryption_key_here/$encryption_key/g" "$ENV_FILE"
    fi
    
    # Set secure permissions
    set_secure_permissions "$ENV_FILE" 600
    
    print_status "Created .env file from template with generated encryption key"
    print_warning "Please edit .env file and add your actual Lark credentials"
}

# Function to validate environment setup
validate_env_setup() {
    print_header "Environment Validation"
    
    local issues=0
    
    # Check if .env file exists and has correct permissions
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error ".env file not found"
        ((issues++))
    else
        if ! check_file_permissions "$ENV_FILE" "600"; then
            print_warning ".env file permissions should be 600"
            ((issues++))
        fi
    fi
    
    # Check secure directory
    if [[ ! -d "$LARK_MCP_DIR" ]]; then
        print_warning "Secure directory $LARK_MCP_DIR not found"
        ((issues++))
    fi
    
    # Check for hardcoded secrets in config files
    local config_files=("$PROJECT_DIR"/*.json)
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]] && grep -q "cli_[a-zA-Z0-9]" "$config_file" 2>/dev/null; then
            print_error "Potential hardcoded credentials found in $config_file"
            ((issues++))
        fi
    done
    
    if [[ $issues -eq 0 ]]; then
        print_status "Environment validation passed"
    else
        print_warning "Found $issues security issues"
    fi
    
    return $issues
}

# Function to create Docker secrets
setup_docker_secrets() {
    print_header "Docker Secrets Setup"
    
    echo "Do you want to setup Docker secrets? (y/n)"
    read -r setup_docker
    
    if [[ "$setup_docker" =~ ^[Yy]$ ]]; then
        local secrets_dir="$PROJECT_DIR/secrets"
        create_secure_directory "$secrets_dir"
        
        echo "Enter your Lark App ID:"
        read -r app_id
        echo "Enter your Lark App Secret:"
        read -rs app_secret
        
        # Create secret files
        echo -n "$app_id" > "$secrets_dir/app_id.txt"
        echo -n "$app_secret" > "$secrets_dir/app_secret.txt"
        
        # Generate encryption key for Docker
        generate_encryption_key > "$secrets_dir/encryption_key.txt"
        
        # Set secure permissions
        set_secure_permissions "$secrets_dir/app_id.txt" 600
        set_secure_permissions "$secrets_dir/app_secret.txt" 600
        set_secure_permissions "$secrets_dir/encryption_key.txt" 600
        
        print_status "Docker secrets created in $secrets_dir"
        print_warning "Add $secrets_dir to .gitignore if not already present"
    fi
}

# Function to create security monitoring script
create_monitoring_script() {
    print_header "Security Monitoring Setup"
    
    cat > "$PROJECT_DIR/scripts/security-monitor.sh" << 'EOF'
#!/bin/bash
# Security monitoring script for Lark OpenAPI MCP

LARK_MCP_DIR="$HOME/.lark-mcp"
SECURITY_LOG="$LARK_MCP_DIR/security.log"
CREDENTIALS_FILE="$LARK_MCP_DIR/secure-credentials.json"

# Check file permissions
check_permissions() {
    echo "=== Security Permissions Check ==="
    
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        local perm=$(stat -c "%a" "$CREDENTIALS_FILE" 2>/dev/null || stat -f "%A" "$CREDENTIALS_FILE" 2>/dev/null)
        if [[ "$perm" != "600" ]]; then
            echo "WARNING: Credentials file has permissions $perm (should be 600)"
        else
            echo "OK: Credentials file permissions are secure"
        fi
    fi
    
    if [[ -f ".env" ]]; then
        local perm=$(stat -c "%a" ".env" 2>/dev/null || stat -f "%A" ".env" 2>/dev/null)
        if [[ "$perm" != "600" ]]; then
            echo "WARNING: .env file has permissions $perm (should be 600)"
        else
            echo "OK: .env file permissions are secure"
        fi
    fi
}

# Check for hardcoded secrets
check_hardcoded_secrets() {
    echo "=== Hardcoded Secrets Check ==="
    
    local found_secrets=0
    
    # Check JSON config files
    for file in *.json; do
        if [[ -f "$file" ]] && grep -q "cli_[a-zA-Z0-9]" "$file" 2>/dev/null; then
            echo "WARNING: Potential hardcoded credentials in $file"
            ((found_secrets++))
        fi
    done
    
    if [[ $found_secrets -eq 0 ]]; then
        echo "OK: No hardcoded secrets detected"
    fi
}

# Check token age
check_token_age() {
    echo "=== Token Age Check ==="
    
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        local file_age=$(($(date +%s) - $(stat -c %Y "$CREDENTIALS_FILE" 2>/dev/null || stat -f %m "$CREDENTIALS_FILE" 2>/dev/null)))
        local days_old=$((file_age / 86400))
        
        if [[ $days_old -gt 7 ]]; then
            echo "WARNING: Credentials file is $days_old days old (consider rotation)"
        else
            echo "OK: Credentials file is recent ($days_old days old)"
        fi
    fi
}

# Main monitoring function
main() {
    echo "Security Monitor Report - $(date)"
    echo "======================================="
    
    check_permissions
    echo
    check_hardcoded_secrets
    echo
    check_token_age
    echo
    
    # Log to security log if enabled
    if [[ "${SECURITY_LOGGING_ENABLED:-false}" == "true" ]]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - Security check completed" >> "$SECURITY_LOG"
    fi
}

main "$@"
EOF
    
    chmod +x "$PROJECT_DIR/scripts/security-monitor.sh"
    print_status "Created security monitoring script: scripts/security-monitor.sh"
}

# Main function
main() {
    print_header "Lark OpenAPI MCP - Secure Environment Setup"
    
    # Create secure directory
    create_secure_directory "$LARK_MCP_DIR"
    
    # Setup environment file
    create_env_file
    
    # Platform-specific secret management
    case "$OSTYPE" in
        darwin*)
            setup_macos_keychain
            ;;
        linux-gnu*)
            setup_linux_secrets
            ;;
    esac
    
    # Docker secrets setup
    setup_docker_secrets
    
    # Create monitoring script
    create_monitoring_script
    
    # Validate setup
    echo
    validate_env_setup
    
    print_header "Setup Complete"
    print_status "Next steps:"
    echo "1. Edit .env file with your actual Lark credentials"
    echo "2. Run 'scripts/security-monitor.sh' to check security status"
    echo "3. Consider using external secrets management for production"
    echo "4. Regularly rotate your credentials (quarterly recommended)"
    
    if [[ -f "$PROJECT_DIR/scripts/load-keychain-env.sh" ]] || [[ -f "$PROJECT_DIR/scripts/load-secrets-env.sh" ]]; then
        echo "5. Source the credential loader script before running the application"
    fi
}

# Run main function
main "$@"