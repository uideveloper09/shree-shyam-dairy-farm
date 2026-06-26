# Enterprise folder migration — Shree Shyam Dairy Farm
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Creating src/ enterprise folders..."
$dirs = @(
  "src/app", "src/components", "src/features/account", "src/features/mobile",
  "src/features/subscription", "src/features/tenant", "src/features/providers",
  "src/features/cart", "src/hooks", "src/modules", "src/services",
  "src/repositories", "src/lib", "src/utils", "src/types", "src/config",
  "src/constants", "src/styles", "src/assets"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

function Move-Safe($from, $to) {
  if (Test-Path $from) {
    $parent = Split-Path $to -Parent
    if ($parent -and !(Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Move-Item -Path $from -Destination $to -Force
    Write-Host "  $from -> $to"
  }
}

Write-Host "Moving app, hooks..."
Move-Safe "app" "src/app"
Move-Safe "hooks" "src/hooks"

Write-Host "Moving globals.css to styles..."
Move-Safe "src/app/globals.css" "src/styles/globals.css"

Write-Host "Moving middleware and instrumentation..."
Move-Safe "middleware.ts" "src/middleware.ts"
Move-Safe "instrumentation.ts" "src/instrumentation.ts"

Write-Host "Moving feature UI folders..."
Move-Safe "components/subscription" "src/features/subscription"
Move-Safe "components/mobile" "src/features/mobile"
Move-Safe "components/account" "src/features/account"
Move-Safe "components/tenant" "src/features/tenant"
Move-Safe "components/providers" "src/features/providers"
Move-Safe "components" "src/components"

Write-Host "Moving context and store to features/cart..."
Move-Safe "context" "src/features/cart/context"
Move-Safe "store" "src/features/cart/store"

Write-Host "Moving lib/db to repositories..."
Move-Safe "lib/db/prisma.ts" "src/repositories/prisma.ts"
if (Test-Path "lib/db") { Remove-Item "lib/db" -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host "Moving lib/services to services..."
Move-Safe "lib/services" "src/services"

Write-Host "Moving domain modules..."
$domains = @("crm", "fleet", "retail", "processing", "saas", "ai-platform", "notifications", "workflows", "documents", "integrations")
foreach ($d in $domains) {
  if (Test-Path "lib/$d") {
    Move-Safe "lib/$d" "src/modules/$d"
    $svc = "src/modules/$d/service.ts"
    if (Test-Path $svc) {
      $destDir = "src/services/$d"
      New-Item -ItemType Directory -Force -Path $destDir | Out-Null
      Move-Safe $svc "$destDir/service.ts"
    }
  }
}

Write-Host "Moving constants and config..."
Move-Safe "lib/tenant/constants.ts" "src/constants/tenant.ts"
Move-Safe "lib/auth/constants.ts" "src/constants/auth.ts"
Move-Safe "lib/tokens.js" "src/constants/tokens.js"
Move-Safe "lib/layout.js" "src/constants/layout.js"
Move-Safe "lib/ops/env.ts" "src/config/env.ts"

Write-Host "Moving lib root JS utilities..."
$utils = @(
  "utils.js", "routes.js", "data.js", "cart.js", "site.js", "sections.js",
  "sectionScroll.js", "sectionMountRegistry.js", "chatAssistant.js",
  "loadRazorpay.js", "razorpayCheckout.js", "razorpayServer.js",
  "razorpaySubscriptions.js", "paymentMethods.js"
)
foreach ($f in $utils) {
  Move-Safe "lib/$f" "src/utils/$f"
}

Write-Host "Moving remaining lib to src/lib..."
if (Test-Path "lib") {
  Get-ChildItem "lib" -Recurse | ForEach-Object { Write-Host "  remaining: $($_.FullName)" }
  Move-Safe "lib" "src/lib"
}

Write-Host "Creating types index..."
@'
// Re-export domain types from modules
export type { } from "@/modules/crm/types";
'@ | Set-Content "src/types/index.ts" -Encoding UTF8

Write-Host "Migration moves complete."
