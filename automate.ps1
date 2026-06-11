# Setup target time (8:41 AM today to be safely past the reset)
$TargetTime = (Get-Date).Date.AddHours(19).AddMinutes(21)

Write-Host "NearestPub Ultimate Automation Loop Initialized." -ForegroundColor Cyan
Write-Host "Waiting until $TargetTime to execute Claude Code..." -ForegroundColor Yellow

# Loop and sleep until it's 8:41 AM
while ((Get-Date) -lt $TargetTime) {
    Start-Sleep -Seconds 30
}

Write-Host "Rate limit reset time reached! Waking up Claude Agent..." -ForegroundColor Green

# Launch Claude Code headlessly with auto-approvals for all tasks
claude -p 
"Resume building the NearestPub React Native application and execute the instructions with maximum effort:"

