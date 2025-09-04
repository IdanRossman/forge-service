$testBody = @'
{
  "items": [
    {
      "itemType": "weapon",
      "itemLevel": 150,
      "selectedOption": "21%+ Attack",
      "cubeType": "black",
      "isDMT": false,
      "itemName": "Fafnir Lost Cannon"
    },
    {
      "itemType": "accessory",
      "itemLevel": 120,
      "selectedOption": "2 Lines Involving Item Drop% or Mesos Obtained%",
      "cubeType": "black",
      "isDMT": false,
      "itemName": "Mechanator Pendant"
    },
    {
      "itemType": "accessory",
      "itemLevel": 140,
      "selectedOption": "30%+ Stat",
      "cubeType": "black",
      "isDMT": false,
      "itemName": "Dominator Pendant"
    }
  ]
}
'@

Write-Host "Testing individual cubes endpoint..." -ForegroundColor Yellow
Write-Host "Payload:" -ForegroundColor Cyan
Write-Host $testBody

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/potential/bulk-calculate-individual-cubes" -Method POST -Body $testBody -ContentType "application/json"
    
    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Results:" -ForegroundColor Cyan
    
    foreach($item in $response.results) {
        Write-Host "`n- Item: $($item.itemName)" -ForegroundColor White
        Write-Host "  Type: $($item.itemType) | Level: $($item.itemLevel)" -ForegroundColor White
        Write-Host "  CubeType: $($item.cubeType) | DMT: $($item.isDMT)" -ForegroundColor White
        
        if($item.result) {
            Write-Host "  Cost: $([math]::Round($item.result.averageCost / 1000000, 1))M mesos" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: $($item.error)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nSummary Total: $([math]::Round($response.summary.totalAverageCost / 1000000, 1))M mesos" -ForegroundColor Magenta
    
} catch {
    Write-Host "`nERROR!" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    # Try to parse error response
    try {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Response: $($errorResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Red
    } catch {
        # Couldn't parse as JSON
    }
}
