$files = Get-ChildItem "C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data\*.json"

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($content.Count -gt 0 -and $content[0].rating) {
        Write-Host "$($f.Name): first prompt has tier = $($content[0].rating.tier), overall = $($content[0].rating.overall)"
    }
}