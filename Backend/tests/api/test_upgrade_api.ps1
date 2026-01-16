# Test Script: Upgrade API Flow (PowerShell)
# Usage: .\test_upgrade_api.ps1 -Token <TOKEN> -TenantId <TENANT_ID> -NewPlanId <NEW_PLAN_ID>

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$NewPlanId
)

$BaseUrl = "http://localhost:8089/api/v1"
$Headers = @{
    "Authorization" = "Bearer $Token"
    "X-Tenant-ID" = $TenantId
    "Content-Type" = "application/json"
}

Write-Host "=== Test Upgrade API Flow ===" -ForegroundColor Cyan
Write-Host ""

# 1. Get current billing info
Write-Host "1. Getting current billing info..." -ForegroundColor Yellow
try {
    $billing = Invoke-RestMethod -Uri "$BaseUrl/billing" -Headers $Headers -Method Get
    Write-Host "Current Plan: $($billing.data.subscription.plan_name)" -ForegroundColor Green
    Write-Host "Plan ID: $($billing.data.subscription.plan_id)"
    Write-Host "Status: $($billing.data.subscription.status)"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "---"

# 2. Request upgrade
Write-Host "2. Requesting upgrade to plan: $NewPlanId" -ForegroundColor Yellow
$upgradeBody = @{ plan_id = $NewPlanId } | ConvertTo-Json

try {
    $upgradeResponse = Invoke-RestMethod -Uri "$BaseUrl/billing/subscription" -Headers $Headers -Method Put -Body $upgradeBody
    Write-Host "Response:" -ForegroundColor Green
    $upgradeResponse | ConvertTo-Json -Depth 5
    
    $orderId = $upgradeResponse.data.order_id
    
    if ($orderId) {
        Write-Host ""
        Write-Host "Order created: $orderId" -ForegroundColor Cyan
        Write-Host "---"
        
        # 3. Get invoice details
        Write-Host "3. Getting invoice details..." -ForegroundColor Yellow
        $invoice = Invoke-RestMethod -Uri "$BaseUrl/payment/$orderId/details" -Headers $Headers -Method Get
        Write-Host "Amount: Rp $($invoice.data.amount)"
        Write-Host "Status: $($invoice.data.status)"
        
        # Check if payment already exists
        if ($invoice.data.has_payment) {
            Write-Host "Payment already exists!" -ForegroundColor Green
            $invoice.data.payment_info | ConvertTo-Json
        }
        
        Write-Host ""
        Write-Host "---"
        
        # 4. Create payment token (BCA VA)
        Write-Host "4. Creating payment token (BCA VA)..." -ForegroundColor Yellow
        $paymentBody = @{ payment_method = "bca_va" } | ConvertTo-Json
        
        try {
            $paymentResponse = Invoke-RestMethod -Uri "$BaseUrl/payment/$orderId/token" -Headers $Headers -Method Post -Body $paymentBody
            Write-Host "Payment created:" -ForegroundColor Green
            
            if ($paymentResponse.data.va_numbers) {
                foreach ($va in $paymentResponse.data.va_numbers) {
                    Write-Host "Bank: $($va.bank.ToUpper())" -ForegroundColor Cyan
                    Write-Host "VA Number: $($va.va_number)" -ForegroundColor White -BackgroundColor DarkBlue
                }
            }
        } catch {
            Write-Host "Error creating payment: $_" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "---"
        
        # 5. Check payment status
        Write-Host "5. Checking payment status..." -ForegroundColor Yellow
        $status = Invoke-RestMethod -Uri "$BaseUrl/payment/$orderId/status" -Headers $Headers -Method Get
        Write-Host "Status: $($status.data.status)"
        
        Write-Host ""
        Write-Host "=== Instructions ===" -ForegroundColor Cyan
        Write-Host "1. Pay using the VA number shown above"
        Write-Host "2. After payment, run this script again or check status manually"
        Write-Host "3. The plan will be upgraded automatically after payment confirmation"
        
    } else {
        Write-Host ""
        Write-Host "No order created - upgrade may have been applied immediately (downgrade)" -ForegroundColor Green
        
        # Verify the change
        Write-Host ""
        Write-Host "Verifying change..." -ForegroundColor Yellow
        $newBilling = Invoke-RestMethod -Uri "$BaseUrl/billing" -Headers $Headers -Method Get
        Write-Host "New Plan: $($newBilling.data.subscription.plan_name)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    $_.Exception.Response
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
