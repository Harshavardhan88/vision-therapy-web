$ErrorActionPreference = "Stop"

try {
    Write-Host "0. Creating/Checking User..."
    $uniqueId = Get-Date -Format "mmss"
    $email = "patient_$uniqueId@example.com"
    $password = "patient123"
    
    $userBody = @{ full_name = "Test Patient $uniqueId"; email = $email; password = $password; role = "patient" } | ConvertTo-Json
    try {
        $msg = Invoke-RestMethod -Uri 'http://localhost:8000/users/' -Method Post -Body $userBody -Headers @{ "Content-Type" = "application/json" }
        Write-Host "   User created: $email"
    }
    catch {
        Write-Host "   User creation failed: $_"
        exit 1
    }

    Write-Host "1. Logging in..."
    $body = @{ username = $email; password = $password }
    $tokenResponse = Invoke-RestMethod -Uri 'http://localhost:8000/token' -Method Post -Body $body
    $token = $tokenResponse.access_token
    Write-Host "   Token received."

    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

    Write-Host "2. Getting current user info..."
    $userResponse = Invoke-RestMethod -Uri 'http://localhost:8000/users/me' -Method Get -Headers $headers
    $userId = $userResponse.id
    Write-Host "   User ID: $userId"

    Write-Host "3. Posting a test session..."
    $sessionData = @{
        user_id           = $userId
        game_type         = "test_game_vr"
        difficulty        = "medium"
        duration_seconds  = 120
        score             = 999
        balloons_popped   = 10
        accuracy          = 0.95
        fixation_accuracy = 0.90
        avg_response_time = 0.5
    } | ConvertTo-Json

    $postResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/sessions' -Method Post -Headers $headers -Body $sessionData
    Write-Host "   Session Saved. ID: $($postResponse.id)"

    Write-Host "4. Verifying session in history..."
    $sessions = Invoke-RestMethod -Uri "http://localhost:8000/api/sessions/$userId" -Method Get -Headers $headers
    
    $found = $null
    foreach ($s in $sessions) {
        if ($s.score -eq 999 -and $s.game_type -eq "test_game_vr") {
            $found = $s
            break
        }
    }

    if ($found) {
        Write-Host "SUCCESS: Found session with score 999!"
        Write-Host "Session Details: $($found | ConvertTo-Json -Depth 2)"
    }
    else {
        Write-Error "FAILURE: Could not find the saved session."
    }

}
catch {
    Write-Host "An error occurred: $_"
    exit 1
}
