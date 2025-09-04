# Test smart cube optimization (cubeType: null)
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    items = @(
        @{
            itemType = "weapon"
            itemLevel = 200
            selectedOption = "21%+ Attack"
            cubeType = $null  # Smart optimization
            isDMT = $false
            itemName = "Fafnir Test Weapon"
        },
        @{
            itemType = "ring"
            itemLevel = 160
            selectedOption = "21%+ Stat"
            cubeType = "red"  # Specified cube type
            isDMT = $false
            itemName = "Manual Red Ring"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "=== Testing Smart Cube Optimization ===" -ForegroundColor Green
Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/potential/bulk-calculate-individual-cubes" -Method POST -Body $body -Headers $headers
    
    Write-Host "`n=== Response ===" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    
    Write-Host "`n=== Summary ===" -ForegroundColor Green
    foreach ($result in $response.results) {
        $optimization = if ($result.itemName -eq "Fafnir Test Weapon") { " (OPTIMIZED)" } else { " (MANUAL)" }
        Write-Host "$($result.itemName): $($result.cubeType) cubes - $($result.result.averageCost)M mesos$optimization" -ForegroundColor Yellow
    }
    
    Write-Host "`nTotal Cost: $($response.summary.totalAverageCost)M mesos" -ForegroundColor Magenta
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}
