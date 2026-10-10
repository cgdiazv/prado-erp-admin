Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\app\favicon.png"
$publicDir = Join-Path $PSScriptRoot "..\public"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcImage = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source image loaded: $($srcImage.Width)x$($srcImage.Height)"

function Resize-SquareImage {
    param(
        [System.Drawing.Image]$img,
        [int]$size,
        [string]$outputPath,
        [float]$paddingRatio = 0.0
    )
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $destSize = [int]($size * (1.0 - ($paddingRatio * 2)))
    $offset = [int]($size * $paddingRatio)
    
    # Calculate aspect-ratio fitted rectangle
    $aspect = $img.Width / $img.Height
    if ($aspect -gt 1.0) {
        $drawW = $destSize
        $drawH = [int]($destSize / $aspect)
        $drawX = $offset
        $drawY = $offset + [int](($destSize - $drawH) / 2)
    } else {
        $drawH = $destSize
        $drawW = [int]($destSize * $aspect)
        $drawY = $offset
        $drawX = $offset + [int](($destSize - $drawW) / 2)
    }
    
    $destRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
    $g.DrawImage($img, $destRect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($sizex$size)"
}

Resize-SquareImage -img $srcImage -size 192 -outputPath (Join-Path $publicDir "icon-192.png")
Resize-SquareImage -img $srcImage -size 512 -outputPath (Join-Path $publicDir "icon-512.png")
Resize-SquareImage -img $srcImage -size 512 -outputPath (Join-Path $publicDir "icon-maskable-512.png") -paddingRatio 0.1
Resize-SquareImage -img $srcImage -size 180 -outputPath (Join-Path $publicDir "apple-touch-icon.png")
Resize-SquareImage -img $srcImage -size 32  -outputPath (Join-Path $publicDir "favicon-32x32.png")

$srcImage.Dispose()
Write-Host "All icons generated successfully!"
