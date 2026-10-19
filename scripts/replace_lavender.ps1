Get-ChildItem -Recurse -Path "src/components" -Filter "*.css" | ForEach-Object {
  $path = $_.FullName
  $content = Get-Content $path -Raw
  $updated = $content `
    -replace "pastel-lavender-bg", "pastel-green-bg" `
    -replace "pastel-lavender-border", "pastel-green-border" `
    -replace "pastel-lavender-text", "pastel-green-text" `
    -replace "pastel-lavender-accent", "pastel-green-accent"
  if ($content -ne $updated) {
    Set-Content $path $updated
    Write-Host "Updated: $($_.Name)"
  }
}
