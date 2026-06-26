# Bulk import path updates after src/ migration
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs")
$searchPaths = @("src", "tests", "prisma", "workers", "next.config.ts", "sdk")

# Order matters: longest / most specific patterns first
$replacements = [ordered]@{
  '@/lib/crm/service' = '@/services/crm/service'
  '@/lib/fleet/service' = '@/services/fleet/service'
  '@/lib/retail/service' = '@/services/retail/service'
  '@/lib/processing/service' = '@/services/processing/service'
  '@/lib/saas/service' = '@/services/saas/service'
  '@/lib/ai-platform/service' = '@/services/ai-platform/service'
  '@/lib/notifications/service' = '@/services/notifications/service'
  '@/lib/workflows/service' = '@/services/workflows/service'
  '@/lib/documents/service' = '@/services/documents/service'
  '@/lib/integrations/service' = '@/services/integrations/service'
  '@/lib/services/' = '@/services/'
  '@/lib/db/prisma' = '@/repositories/prisma'
  '@/lib/tenant/constants' = '@/constants/tenant'
  '@/lib/auth/constants' = '@/constants/auth'
  '@/lib/ops/env' = '@/config/env'
  '@/lib/integrations/' = '@/modules/integrations/'
  '@/lib/notifications/' = '@/modules/notifications/'
  '@/lib/ai-platform/' = '@/modules/ai-platform/'
  '@/lib/workflows/' = '@/modules/workflows/'
  '@/lib/documents/' = '@/modules/documents/'
  '@/lib/processing/' = '@/modules/processing/'
  '@/lib/integrations' = '@/modules/integrations'
  '@/lib/crm/' = '@/modules/crm/'
  '@/lib/fleet/' = '@/modules/fleet/'
  '@/lib/retail/' = '@/modules/retail/'
  '@/lib/processing' = '@/modules/processing'
  '@/lib/saas/' = '@/modules/saas/'
  '@/lib/razorpaySubscriptions' = '@/utils/razorpaySubscriptions'
  '@/lib/razorpayCheckout' = '@/utils/razorpayCheckout'
  '@/lib/razorpayServer' = '@/utils/razorpayServer'
  '@/lib/sectionMountRegistry' = '@/utils/sectionMountRegistry'
  '@/lib/sectionScroll' = '@/utils/sectionScroll'
  '@/lib/chatAssistant' = '@/utils/chatAssistant'
  '@/lib/loadRazorpay' = '@/utils/loadRazorpay'
  '@/lib/paymentMethods' = '@/utils/paymentMethods'
  '@/lib/sections' = '@/utils/sections'
  '@/lib/routes' = '@/utils/routes'
  '@/lib/tokens' = '@/constants/tokens'
  '@/lib/layout' = '@/constants/layout'
  '@/lib/data' = '@/utils/data'
  '@/lib/utils' = '@/utils/utils'
  '@/lib/cart' = '@/utils/cart'
  '@/lib/site' = '@/utils/site'
  '@/components/subscription/' = '@/features/subscription/'
  '@/components/mobile/' = '@/features/mobile/'
  '@/components/account/' = '@/features/account/'
  '@/components/tenant/' = '@/features/tenant/'
  '@/components/providers/' = '@/features/providers/'
  '@/context/' = '@/features/cart/context/'
  '@/store/' = '@/features/cart/store/'
  './lib/ops/security' = './src/lib/ops/security'
}

$files = @()
foreach ($sp in $searchPaths) {
  if (Test-Path $sp -PathType Leaf) { $files += Get-Item $sp; continue }
  if (Test-Path $sp) {
    foreach ($ext in $extensions) {
      $files += Get-ChildItem -Path $sp -Filter $ext -Recurse -File -ErrorAction SilentlyContinue
    }
  }
}

$updated = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content
  foreach ($kv in $replacements.GetEnumerator()) {
    $content = $content.Replace($kv.Key, $kv.Value)
  }
  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    $updated++
  }
}

Write-Host "Updated imports in $updated files."
