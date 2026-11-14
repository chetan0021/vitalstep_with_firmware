# Git push script with proper authentication
# This script will push to GitHub with your credentials

$gitEmail = "chetanv.kar@gmail.com"
$gitUsername = "chetan0021"
$repoUrl = "https://github.com/chetan0021/vitalstep_with_firmware"

# Set git config locally for this repo
Write-Host "Setting up git configuration..."
& git config user.email "$gitEmail"
& git config user.name "$gitUsername"

# Check git status
Write-Host ""
Write-Host "Current git status:"
& git status

# Stage all changes
Write-Host ""
Write-Host "Staging changes..."
& git add -A

# Check what's staged
Write-Host ""
Write-Host "Changes to commit:"
& git status

# Commit if there are changes
$status = & git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "Committing changes..."
    & git commit -m "Dashboard integration and configuration updates"
} else {
    Write-Host ""
    Write-Host "No changes to commit"
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..."
Write-Host "Repository: $repoUrl"
Write-Host "Branch: main"
Write-Host ""
Write-Host "A Git Credential Manager window should appear now. Please login with your GitHub account."
Write-Host ""

& git push origin main -v

Write-Host ""
Write-Host "Push complete!"
