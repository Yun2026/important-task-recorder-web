# Task Recorder Web Application Deployment Script
# Target Server: 106.52.126.158

$ErrorActionPreference = "Stop"

$SERVER_IP = "106.52.126.158"
$SERVER_USER = "root"
$REMOTE_DIR = "/app/task-recorder"
$CONTAINER_NAME = "task-recorder-app"
$IMAGE_NAME = "task-recorder"

Write-Host "Starting deployment..." -ForegroundColor Green
Write-Host ""

# Check if dist directory exists
if (-not (Test-Path "dist")) {
    Write-Host "Error: dist directory not found. Please run 'npm run build' first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Preparing deployment package..." -ForegroundColor Cyan

# Create deployment package
try {
    tar -czvf deploy-package.tar.gz dist Dockerfile
    Write-Host "Deployment package created successfully" -ForegroundColor Green
}
catch {
    Write-Host "Failed to create deployment package: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Uploading files to server ($SERVER_IP)..." -ForegroundColor Cyan

try {
    scp deploy-package.tar.gz "${SERVER_USER}@${SERVER_IP}:/root/"
    Write-Host "Files uploaded successfully" -ForegroundColor Green
}
catch {
    Write-Host "Upload failed: $_" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. Server IP is correct" -ForegroundColor Yellow
    Write-Host "  2. SSH connection is available" -ForegroundColor Yellow
    Write-Host "  3. SSH key or password is configured" -ForegroundColor Yellow
    Remove-Item -Force deploy-package.tar.gz -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Executing deployment on server..." -ForegroundColor Cyan

try {
    # Create app directory
    ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_DIR"
    Write-Host "App directory created" -ForegroundColor Cyan
    
    # Extract deployment package
    ssh "${SERVER_USER}@${SERVER_IP}" "cd $REMOTE_DIR; tar -xzvf /root/deploy-package.tar.gz -C $REMOTE_DIR"
    Write-Host "Deployment package extracted" -ForegroundColor Cyan
    
    # Check and install Docker
    $dockerCheck = ssh "${SERVER_USER}@${SERVER_IP}" "command -v docker"
    if (-not $dockerCheck) {
        Write-Host "Installing Docker..." -ForegroundColor Yellow
        ssh "${SERVER_USER}@${SERVER_IP}" "apt-get update"
        ssh "${SERVER_USER}@${SERVER_IP}" "apt-get install -y docker.io"
        ssh "${SERVER_USER}@${SERVER_IP}" "systemctl start docker"
        ssh "${SERVER_USER}@${SERVER_IP}" "systemctl enable docker"
        Write-Host "Docker installed successfully" -ForegroundColor Cyan
    } else {
        Write-Host "Docker already installed" -ForegroundColor Cyan
    }
    
    # Stop old container
    ssh "${SERVER_USER}@${SERVER_IP}" "docker stop $CONTAINER_NAME" 2>$null
    # Remove old container
    ssh "${SERVER_USER}@${SERVER_IP}" "docker rm $CONTAINER_NAME" 2>$null
    Write-Host "Old containers cleaned" -ForegroundColor Cyan
    
    # Remove old image
    ssh "${SERVER_USER}@${SERVER_IP}" "docker rmi $IMAGE_NAME" 2>$null
    Write-Host "Old images cleaned" -ForegroundColor Cyan
    
    # Build new image
    ssh "${SERVER_USER}@${SERVER_IP}" "cd $REMOTE_DIR; docker build -t $IMAGE_NAME ."
    Write-Host "New image built" -ForegroundColor Cyan
    
    # Start new container
    ssh "${SERVER_USER}@${SERVER_IP}" "docker run -d --name $CONTAINER_NAME -p 80:8080 --restart always $IMAGE_NAME"
    Write-Host "New container started" -ForegroundColor Cyan
    
    # Configure firewall
    ssh "${SERVER_USER}@${SERVER_IP}" "ufw allow 80/tcp" 2>$null
    ssh "${SERVER_USER}@${SERVER_IP}" "ufw allow 8080/tcp" 2>$null
    Write-Host "Firewall configured" -ForegroundColor Cyan
    
    Write-Host "Remote deployment successful" -ForegroundColor Green
}
catch {
    Write-Host "Remote deployment failed: $_" -ForegroundColor Red
    Remove-Item -Force deploy-package.tar.gz -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
Remove-Item -Force deploy-package.tar.gz -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Website URL: http://$SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features:" -ForegroundColor Yellow
Write-Host "  - Task management (create, edit, delete, complete)" -ForegroundColor White
Write-Host "  - Focus mode (Pomodoro timer)" -ForegroundColor White
Write-Host "  - Data filtering and search" -ForegroundColor White
Write-Host "  - Export functionality" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
