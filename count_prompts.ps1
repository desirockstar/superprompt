$total = 0
$graded = 0
$ungraded = 0

$files = Get-ChildItem "C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data\*.json"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    $total += $content.Count
    
    foreach ($item in $content) {
        if ($item.rating) {
            $graded++
        } else {
            $ungraded++
        }
    }
}

Write-Host "Total prompts: $total"
Write-Host "Graded: $graded"
Write-Host "Ungraded: $ungraded"