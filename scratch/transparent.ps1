Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("C:\Users\akinrodolu.olajide\.gemini\antigravity-ide\brain\9cad3fa2-4305-4341-9c7a-34635d6da26a\.user_uploaded\media_1790232428661.png")
$bmp.MakeTransparent([System.Drawing.Color]::White)
$bmp.Save("c:\Users\akinrodolu.olajide\Downloads\PATCHWORK\apps\mobile\assets\images\builders.png", [System.Drawing.Imaging.ImageFormat]::Png)
