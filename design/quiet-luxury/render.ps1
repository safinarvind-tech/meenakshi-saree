param([string[]]$pages)
$chrome="C:\Program Files\Google\Chrome\Application\chrome.exe"
$dir=$PSScriptRoot
foreach($p in $pages){
  $u=([uri]"$dir\$p.html").AbsoluteUri
  $dom = & $chrome --headless=new --disable-gpu --virtual-time-budget=15000 --allow-file-access-from-files --window-size=1440,1000 --dump-dom $u 2>$null | Out-String
  if($dom -match 'data-h="(\d+)"'){ $h=[int]$matches[1] } else { $h=5000 }
  & $chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 --allow-file-access-from-files --window-size=1440,$h --screenshot="$dir\$p.png" $u 2>$null | Out-Null
  "$p height=$h"
}
