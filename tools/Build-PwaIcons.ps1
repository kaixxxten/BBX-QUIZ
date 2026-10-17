param()

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$toolDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDirectory = Split-Path -Parent $toolDirectory
$iconDirectory = Join-Path $projectDirectory "icons"

if (-not (Test-Path -LiteralPath $iconDirectory)) {
  New-Item -ItemType Directory -Path $iconDirectory | Out-Null
}

function New-BbxIcon {
  param(
    [int]$Size,
    [string]$OutputName
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.Color]::FromArgb(23, 43, 85))

    $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 66, 127))
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(3, $Size * 0.022))
    $yellowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(244, 196, 48), [Math]::Max(5, $Size * 0.04))
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    try {
      $margin = [int]($Size * 0.125)
      $panelTop = [int]($Size * 0.31)
      $panelHeight = [int]($Size * 0.38)
      $graphics.FillRectangle($panelBrush, $margin, $panelTop, $Size - (2 * $margin), $panelHeight)
      $graphics.DrawRectangle($whitePen, $margin, $panelTop, $Size - (2 * $margin), $panelHeight)

      $fontSize = [single]($Size * 0.23)
      $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $format = New-Object System.Drawing.StringFormat
      try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $textBounds = New-Object System.Drawing.RectangleF(0, $panelTop, $Size, $panelHeight)
        $graphics.DrawString("BBX", $font, $whiteBrush, $textBounds, $format)
      } finally {
        $format.Dispose()
        $font.Dispose()
      }

      $xCenter = [single]($Size * 0.79)
      $xCenterY = [single]($Size * 0.25)
      $xRadius = [single]($Size * 0.075)
      $graphics.DrawLine($yellowPen, $xCenter - $xRadius, $xCenterY - $xRadius, $xCenter + $xRadius, $xCenterY + $xRadius)
      $graphics.DrawLine($yellowPen, $xCenter + $xRadius, $xCenterY - $xRadius, $xCenter - $xRadius, $xCenterY + $xRadius)
    } finally {
      $panelBrush.Dispose()
      $whitePen.Dispose()
      $yellowPen.Dispose()
      $whiteBrush.Dispose()
    }

    $outputPath = Join-Path $iconDirectory $OutputName
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "PWA icon updated: $outputPath"
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

New-BbxIcon -Size 180 -OutputName "apple-touch-icon-180.png"
New-BbxIcon -Size 192 -OutputName "icon-192.png"
New-BbxIcon -Size 512 -OutputName "icon-512.png"
