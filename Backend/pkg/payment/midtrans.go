package payment

import (
	"bytes"
	"crypto/sha512"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// MidtransConfig holds Midtrans configuration
type MidtransConfig struct {
	ServerKey    string
	ClientKey    string
	IsProduction bool
	MerchantID   string
}

// MidtransClient is the Midtrans API client
type MidtransClient struct {
	config     *MidtransConfig
	httpClient *http.Client
}

// NewMidtransClient creates a new Midtrans client
func NewMidtransClient(config *MidtransConfig) *MidtransClient {
	return &MidtransClient{
		config: config,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetCoreAPIURL returns the Core API URL
func (c *MidtransClient) GetCoreAPIURL() string {
	if c.config.IsProduction {
		return "https://api.midtrans.com/v2"
	}
	return "https://api.sandbox.midtrans.com/v2"
}

// ========================================
// Core API Request/Response Types
// ========================================

// ChargeRequest represents a Core API charge request
type ChargeRequest struct {
	PaymentType        string              `json:"payment_type"`
	TransactionDetails TransactionDetails  `json:"transaction_details"`
	CustomerDetails    *CustomerDetails    `json:"customer_details,omitempty"`
	ItemDetails        []ItemDetail        `json:"item_details,omitempty"`
	BankTransfer       *BankTransferDetail `json:"bank_transfer,omitempty"`
	Echannel           *EchannelDetail     `json:"echannel,omitempty"`
	Gopay              *GopayDetail        `json:"gopay,omitempty"`
	ShopeePay          *ShopeePayDetail    `json:"shopeepay,omitempty"`
	Qris               *QrisDetail         `json:"qris,omitempty"`
	CustomExpiry       *CustomExpiry       `json:"custom_expiry,omitempty"`
}

// TransactionDetails contains transaction information
type TransactionDetails struct {
	OrderID     string  `json:"order_id"`
	GrossAmount float64 `json:"gross_amount"`
}

// CustomerDetails contains customer information
type CustomerDetails struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

// ItemDetail contains item information
type ItemDetail struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
}

// BankTransferDetail for bank transfer payments
type BankTransferDetail struct {
	Bank     string    `json:"bank"` // bca, bni, bri, mandiri, permata, cimb
	VANumber string    `json:"va_number,omitempty"`
	FreeText *FreeText `json:"free_text,omitempty"`
}

// FreeText for VA display
type FreeText struct {
	Inquiry []FreeTextItem `json:"inquiry,omitempty"`
	Payment []FreeTextItem `json:"payment,omitempty"`
}

// FreeTextItem for VA display text
type FreeTextItem struct {
	ID string `json:"id"`
	EN string `json:"en"`
}

// EchannelDetail for Mandiri Bill payment
type EchannelDetail struct {
	BillInfo1 string `json:"bill_info1"`
	BillInfo2 string `json:"bill_info2"`
}

// GopayDetail for GoPay payments
type GopayDetail struct {
	EnableCallback bool   `json:"enable_callback"`
	CallbackURL    string `json:"callback_url,omitempty"`
}

// ShopeePayDetail for ShopeePay payments
type ShopeePayDetail struct {
	CallbackURL string `json:"callback_url,omitempty"`
}

// QrisDetail for QRIS payments
type QrisDetail struct {
	Acquirer string `json:"acquirer,omitempty"` // gopay, airpay shopee
}

// CustomExpiry for custom expiry time
type CustomExpiry struct {
	OrderTime      string `json:"order_time,omitempty"`
	ExpiryDuration int    `json:"expiry_duration"`
	Unit           string `json:"unit"` // second, minute, hour, day
}


// ChargeResponse represents Core API charge response
type ChargeResponse struct {
	StatusCode        string   `json:"status_code"`
	StatusMessage     string   `json:"status_message"`
	TransactionID     string   `json:"transaction_id"`
	OrderID           string   `json:"order_id"`
	GrossAmount       string   `json:"gross_amount"`
	PaymentType       string   `json:"payment_type"`
	TransactionTime   string   `json:"transaction_time"`
	TransactionStatus string   `json:"transaction_status"`
	FraudStatus       string   `json:"fraud_status,omitempty"`
	ValidationMessages []string `json:"validation_messages,omitempty"`

	// Bank Transfer specific
	VANumbers      []VANumber `json:"va_numbers,omitempty"`
	PermataVANumber string    `json:"permata_va_number,omitempty"`
	BillKey        string     `json:"bill_key,omitempty"`
	BillerCode     string     `json:"biller_code,omitempty"`

	// E-Wallet specific
	Actions []Action `json:"actions,omitempty"`

	// QRIS specific
	QRString string `json:"qr_string,omitempty"`

	// Expiry
	ExpiryTime string `json:"expiry_time,omitempty"`
}

// VANumber represents virtual account number
type VANumber struct {
	Bank     string `json:"bank"`
	VANumber string `json:"va_number"`
}

// Action represents payment action (for e-wallets)
type Action struct {
	Name   string `json:"name"`
	Method string `json:"method"`
	URL    string `json:"url"`
}

// ========================================
// Core API Methods
// ========================================

// Charge creates a new payment transaction
func (c *MidtransClient) Charge(req *ChargeRequest) (*ChargeResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := c.GetCoreAPIURL() + "/charge"
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(httpReq)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var chargeResp ChargeResponse
	if err := json.Unmarshal(body, &chargeResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Check for errors
	if chargeResp.StatusCode != "200" && chargeResp.StatusCode != "201" {
		return &chargeResp, fmt.Errorf("midtrans error: %s - %s", chargeResp.StatusCode, chargeResp.StatusMessage)
	}

	return &chargeResp, nil
}

// CreateCharge is an alias for Charge
func (c *MidtransClient) CreateCharge(req ChargeRequest) (*ChargeResponse, error) {
	return c.Charge(&req)
}

// GetTransactionStatus gets the status of a transaction
func (c *MidtransClient) GetTransactionStatus(orderID string) (*ChargeResponse, error) {
	url := fmt.Sprintf("%s/%s/status", c.GetCoreAPIURL(), orderID)
	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(httpReq)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var statusResp ChargeResponse
	if err := json.Unmarshal(body, &statusResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &statusResp, nil
}

// CancelTransaction cancels a pending transaction
func (c *MidtransClient) CancelTransaction(orderID string) (*ChargeResponse, error) {
	url := fmt.Sprintf("%s/%s/cancel", c.GetCoreAPIURL(), orderID)
	httpReq, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(httpReq)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var cancelResp ChargeResponse
	if err := json.Unmarshal(body, &cancelResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &cancelResp, nil
}

// ExpireTransaction expires a pending transaction
func (c *MidtransClient) ExpireTransaction(orderID string) (*ChargeResponse, error) {
	url := fmt.Sprintf("%s/%s/expire", c.GetCoreAPIURL(), orderID)
	httpReq, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(httpReq)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var expireResp ChargeResponse
	if err := json.Unmarshal(body, &expireResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &expireResp, nil
}

func (c *MidtransClient) setHeaders(req *http.Request) {
	auth := base64.StdEncoding.EncodeToString([]byte(c.config.ServerKey + ":"))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
}


// ========================================
// Helper Methods for Creating Charges
// ========================================

// ChargeBankTransfer creates a bank transfer payment
func (c *MidtransClient) ChargeBankTransfer(orderID string, amount float64, bank string, customer *CustomerDetails, items []ItemDetail) (*ChargeResponse, error) {
	req := &ChargeRequest{
		PaymentType: "bank_transfer",
		TransactionDetails: TransactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		CustomerDetails: customer,
		ItemDetails:     items,
		BankTransfer: &BankTransferDetail{
			Bank: bank,
		},
		CustomExpiry: &CustomExpiry{
			ExpiryDuration: 24,
			Unit:           "hour",
		},
	}

	return c.Charge(req)
}

// ChargeMandiriBill creates a Mandiri Bill payment
func (c *MidtransClient) ChargeMandiriBill(orderID string, amount float64, customer *CustomerDetails, items []ItemDetail) (*ChargeResponse, error) {
	req := &ChargeRequest{
		PaymentType: "echannel",
		TransactionDetails: TransactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		CustomerDetails: customer,
		ItemDetails:     items,
		Echannel: &EchannelDetail{
			BillInfo1: "Payment for",
			BillInfo2: orderID,
		},
		CustomExpiry: &CustomExpiry{
			ExpiryDuration: 24,
			Unit:           "hour",
		},
	}

	return c.Charge(req)
}

// ChargeGopay creates a GoPay payment
func (c *MidtransClient) ChargeGopay(orderID string, amount float64, customer *CustomerDetails, items []ItemDetail, callbackURL string) (*ChargeResponse, error) {
	req := &ChargeRequest{
		PaymentType: "gopay",
		TransactionDetails: TransactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		CustomerDetails: customer,
		ItemDetails:     items,
		Gopay: &GopayDetail{
			EnableCallback: true,
			CallbackURL:    callbackURL,
		},
		CustomExpiry: &CustomExpiry{
			ExpiryDuration: 15,
			Unit:           "minute",
		},
	}

	return c.Charge(req)
}

// ChargeShopeePay creates a ShopeePay payment
func (c *MidtransClient) ChargeShopeePay(orderID string, amount float64, customer *CustomerDetails, items []ItemDetail, callbackURL string) (*ChargeResponse, error) {
	req := &ChargeRequest{
		PaymentType: "shopeepay",
		TransactionDetails: TransactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		CustomerDetails: customer,
		ItemDetails:     items,
		ShopeePay: &ShopeePayDetail{
			CallbackURL: callbackURL,
		},
		CustomExpiry: &CustomExpiry{
			ExpiryDuration: 15,
			Unit:           "minute",
		},
	}

	return c.Charge(req)
}

// ChargeQRIS creates a QRIS payment
func (c *MidtransClient) ChargeQRIS(orderID string, amount float64, customer *CustomerDetails, items []ItemDetail) (*ChargeResponse, error) {
	req := &ChargeRequest{
		PaymentType: "qris",
		TransactionDetails: TransactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		CustomerDetails: customer,
		ItemDetails:     items,
		Qris: &QrisDetail{
			Acquirer: "gopay",
		},
		CustomExpiry: &CustomExpiry{
			ExpiryDuration: 15,
			Unit:           "minute",
		},
	}

	return c.Charge(req)
}

// ========================================
// Notification/Webhook Handling
// ========================================

// NotificationPayload represents Midtrans notification webhook payload
type NotificationPayload struct {
	TransactionTime   string `json:"transaction_time"`
	TransactionStatus string `json:"transaction_status"`
	TransactionID     string `json:"transaction_id"`
	StatusMessage     string `json:"status_message"`
	StatusCode        string `json:"status_code"`
	SignatureKey      string `json:"signature_key"`
	PaymentType       string `json:"payment_type"`
	OrderID           string `json:"order_id"`
	MerchantID        string `json:"merchant_id"`
	GrossAmount       string `json:"gross_amount"`
	FraudStatus       string `json:"fraud_status"`
	Currency          string `json:"currency"`
}

// GetPaymentStatus returns normalized payment status
func (n *NotificationPayload) GetPaymentStatus() string {
	switch n.TransactionStatus {
	case "capture":
		if n.FraudStatus == "accept" {
			return "paid"
		}
		return "pending"
	case "settlement":
		return "paid"
	case "pending":
		return "pending"
	case "deny", "cancel", "expire":
		return "failed"
	case "refund":
		return "refunded"
	default:
		return n.TransactionStatus
	}
}

// VerifySignature verifies the notification signature
func (c *MidtransClient) VerifySignature(orderID, statusCode, grossAmount, signatureKey string) bool {
	// Signature = SHA512(order_id + status_code + gross_amount + server_key)
	data := orderID + statusCode + grossAmount + c.config.ServerKey
	hash := sha512.Sum512([]byte(data))
	expectedSignature := fmt.Sprintf("%x", hash)
	return expectedSignature == signatureKey
}

// GetClientKey returns the client key for frontend
func (c *MidtransClient) GetClientKey() string {
	return c.config.ClientKey
}

// ========================================
// Payment Method Constants
// ========================================

const (
	PaymentTypeBankTransfer = "bank_transfer"
	PaymentTypeEchannel     = "echannel" // Mandiri Bill
	PaymentTypeGopay        = "gopay"
	PaymentTypeShopeePay    = "shopeepay"
	PaymentTypeQRIS         = "qris"

	BankBCA     = "bca"
	BankBNI     = "bni"
	BankBRI     = "bri"
	BankMandiri = "mandiri"
	BankPermata = "permata"
	BankCIMB    = "cimb"
)

// AvailablePaymentMethods returns list of available payment methods
func AvailablePaymentMethods() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"id":          "bca_va",
			"name":        "BCA Virtual Account",
			"type":        "bank_transfer",
			"bank":        "bca",
			"description": "Transfer via ATM/Mobile/Internet Banking BCA",
			"icon":        "bca",
		},
		{
			"id":          "bni_va",
			"name":        "BNI Virtual Account",
			"type":        "bank_transfer",
			"bank":        "bni",
			"description": "Transfer via ATM/Mobile/Internet Banking BNI",
			"icon":        "bni",
		},
		{
			"id":          "bri_va",
			"name":        "BRI Virtual Account",
			"type":        "bank_transfer",
			"bank":        "bri",
			"description": "Transfer via ATM/Mobile/Internet Banking BRI",
			"icon":        "bri",
		},
		{
			"id":          "mandiri_bill",
			"name":        "Mandiri Bill Payment",
			"type":        "echannel",
			"description": "Bayar via ATM/Mobile/Internet Banking Mandiri",
			"icon":        "mandiri",
		},
		{
			"id":          "permata_va",
			"name":        "Permata Virtual Account",
			"type":        "bank_transfer",
			"bank":        "permata",
			"description": "Transfer via ATM/Mobile Banking Permata",
			"icon":        "permata",
		},
		{
			"id":          "gopay",
			"name":        "GoPay",
			"type":        "gopay",
			"description": "Bayar dengan GoPay atau scan QRIS",
			"icon":        "gopay",
		},
		{
			"id":          "shopeepay",
			"name":        "ShopeePay",
			"type":        "shopeepay",
			"description": "Bayar dengan ShopeePay",
			"icon":        "shopeepay",
		},
		{
			"id":          "qris",
			"name":        "QRIS",
			"type":        "qris",
			"description": "Scan QR dengan aplikasi e-wallet manapun",
			"icon":        "qris",
		},
	}
}
