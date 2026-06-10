# Setup target time (8:41 AM today to be safely past the reset)
$TargetTime = (Get-Date).Date.AddHours(8).AddMinutes(41)

Write-Host "NearestPub Ultimate Automation Loop Initialized." -ForegroundColor Cyan
Write-Host "Waiting until $TargetTime to execute Claude Code..." -ForegroundColor Yellow

# Loop and sleep until it's 8:41 AM
while ((Get-Date) -lt $TargetTime) {
    Start-Sleep -Seconds 30
}

Write-Host "Rate limit reset time reached! Waking up Claude Agent..." -ForegroundColor Green

# Launch Claude Code headlessly with auto-approvals for all tasks
claude -p "
Resume building the NearestPub React Native application and execute the following sequential instructions with maximum effort:

1. CORE FIX & TESTING:
   - Fix the critical location bias error so it uses the user's actual geolocation coordinates.
   - If geolocation is simulated or fails, the hardcoded fallback MUST be České Budějovice coordinates, NEVER Prague. 
   - WRITE A TEST (or update your test suite) specifically verifying that the location hook resolves to the real coordinates or the Budweis fallback. Use your terminal bash tool to run the test suite, read any errors, and self-correct until the test passes 100%.

2. COMPLETE THE REMAINING MAP & DATA TASKS:
   - Systematically complete the rest of the layout checklist: custom map markers, 'Search this area' exploration button, real road routing, filter by price/beer type, remove the random background pop-ups, and implement local favorites saving.

3. THEME EXPANSION (LIGHT/DARK VARIANTS):
   - Expand the 3 custom premium themes (Amber Lager, Dark Stout, Crisp Pilsner).
   - Ensure that EACH of these 3 premium themes has its own distinct Light Mode and Dark Mode variant (resulting in 6 distinct theme configurations total). Update the theme picker UI to support this beautifully.
" --allowedTools "Read,Edit,Write,MultiEdit,Bash"