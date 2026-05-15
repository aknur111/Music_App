package halyk

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/music-app/payment-service/internal/provider"
)

const (
	TestOAuthURL  = "https://testoauth.homebank.kz/epay2/oauth2/token"
	TestAPIURL    = "https://testepay.homebank.kz"
	TestPortalURL = "https://test-epay.homebank.kz"

	ProdOAuthURL  = "https://epay-oauth.homebank.kz/oauth2/token"
	ProdAPIURL    = "https://epay-api.homebank.kz"
	ProdPortalURL = "https://epay.homebank.kz"
)

type Config struct {
	OAuthURL     string
	APIURL       string
	PortalURL    string
	ClientID     string
	ClientSecret string
	TerminalID   string
	CallbackURL  string
}

type halykProvider struct {
	cfg    Config
	client *http.Client
	log    *zap.Logger
}

func New(cfg Config, log *zap.Logger) provider.Provider {
	if cfg.OAuthURL == "" {
		cfg.OAuthURL = TestOAuthURL
	}
	if cfg.APIURL == "" {
		cfg.APIURL = TestAPIURL
	}
	if cfg.PortalURL == "" {
		cfg.PortalURL = TestPortalURL
	}
	if log == nil {
		log = zap.NewNop()
	}
	return &halykProvider{
		cfg:    cfg,
		client: &http.Client{Timeout: 30 * time.Second},
		log:    log,
	}
}

func (h *halykProvider) ID() string { return "halyk" }

type tokenResponse struct {
	AccessToken string `json:"access_token"`
}

func (h *halykProvider) getToken(ctx context.Context) (string, error) {
	body := url.Values{}
	body.Set("grant_type", "client_credentials")
	body.Set("scope", "webapi usermanagement email_send verification statement statistics payment")

	start := time.Now()
	h.log.Info("halyk: acquiring oauth token", zap.String("url", h.cfg.OAuthURL))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		h.cfg.OAuthURL, strings.NewReader(body.Encode()))
	if err != nil {
		return "", fmt.Errorf("halyk: build auth request: %w", err)
	}
	req.SetBasicAuth(h.cfg.ClientID, h.cfg.ClientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.client.Do(req)
	if err != nil {
		h.log.Error("halyk: oauth token request failed",
			zap.Error(err),
			zap.Duration("elapsed", time.Since(start)),
		)
		return "", fmt.Errorf("halyk: auth request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		h.log.Error("halyk: oauth token non-200 response",
			zap.Int("status", resp.StatusCode),
			zap.String("body", string(raw)),
			zap.Duration("elapsed", time.Since(start)),
		)
		return "", fmt.Errorf("halyk: auth failed with status %d: %s", resp.StatusCode, raw)
	}

	var tr tokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
		return "", fmt.Errorf("halyk: decode auth response: %w", err)
	}
	h.log.Info("halyk: oauth token acquired", zap.Duration("elapsed", time.Since(start)))
	return tr.AccessToken, nil
}

type createInvoiceRequest struct {
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	Terminal    string  `json:"terminal"`
	InvoiceID   string  `json:"invoiceId"`
	BackLink    string  `json:"backLink"`
	FailureLink string  `json:"failureBackLink"`
	PostLink    string  `json:"postLink"`
}

type createInvoiceResponse struct {
	ID      string `json:"id"`
	Invoice struct {
		ID string `json:"id"`
	} `json:"invoice"`
}

func (h *halykProvider) CreateCheckout(ctx context.Context, req provider.CheckoutRequest) (provider.CheckoutResponse, error) {
	token, err := h.getToken(ctx)
	if err != nil {
		return provider.CheckoutResponse{}, err
	}

	payload := createInvoiceRequest{
		Amount:      float64(req.AmountKZT),
		Currency:    "KZT",
		Description: req.Description,
		Terminal:    h.cfg.TerminalID,
		InvoiceID:   req.PaymentID,
		BackLink:    req.ReturnURL,
		FailureLink: req.FailURL,
		PostLink:    h.cfg.CallbackURL,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return provider.CheckoutResponse{}, fmt.Errorf("halyk: marshal create invoice: %w", err)
	}

	invoiceURL := h.cfg.APIURL + "/api/invoice/create"
	start := time.Now()
	h.log.Info("halyk: creating invoice",
		zap.String("url", invoiceURL),
		zap.String("payment_id", req.PaymentID),
		zap.Float64("amount_kzt", payload.Amount),
	)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, invoiceURL, bytes.NewReader(body))
	if err != nil {
		return provider.CheckoutResponse{}, fmt.Errorf("halyk: build create invoice request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(httpReq)
	if err != nil {
		h.log.Error("halyk: invoice creation request failed",
			zap.Error(err),
			zap.Duration("elapsed", time.Since(start)),
		)
		return provider.CheckoutResponse{}, fmt.Errorf("halyk: create invoice request: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		h.log.Error("halyk: invoice creation non-200 response",
			zap.Int("status", resp.StatusCode),
			zap.String("body", string(raw)),
			zap.Duration("elapsed", time.Since(start)),
		)
		return provider.CheckoutResponse{}, fmt.Errorf("halyk: create invoice failed with status %d: %s", resp.StatusCode, raw)
	}

	var cr createInvoiceResponse
	if err := json.Unmarshal(raw, &cr); err != nil {
		return provider.CheckoutResponse{}, fmt.Errorf("halyk: decode create invoice response: %w", err)
	}

	invoiceID := cr.Invoice.ID
	if invoiceID == "" {
		invoiceID = cr.ID
	}
	if invoiceID == "" {
		h.log.Error("halyk: invoice creation response missing id", zap.String("body", string(raw)))
		return provider.CheckoutResponse{}, fmt.Errorf("halyk: create invoice response missing id: %s", raw)
	}

	checkoutURL := fmt.Sprintf("%s/?invoice=%s", h.cfg.PortalURL, invoiceID)
	h.log.Info("halyk: invoice created",
		zap.String("invoice_id", invoiceID),
		zap.String("checkout_url", checkoutURL),
		zap.Duration("elapsed", time.Since(start)),
	)

	return provider.CheckoutResponse{
		ProviderRef: invoiceID,
		CheckoutURL: checkoutURL,
	}, nil
}

type checkStatusResponse struct {
	Status string  `json:"status"`
	Amount float64 `json:"amount"`
}

func (h *halykProvider) VerifyPayment(ctx context.Context, providerRef string) (provider.VerifyResponse, error) {
	token, err := h.getToken(ctx)
	if err != nil {
		return provider.VerifyResponse{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet,
		h.cfg.APIURL+"/api/check-status/payment/transaction/"+providerRef, nil)
	if err != nil {
		return provider.VerifyResponse{}, fmt.Errorf("halyk: build check-status request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)

	resp, err := h.client.Do(httpReq)
	if err != nil {
		return provider.VerifyResponse{}, fmt.Errorf("halyk: check-status request: %w", err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	var cr checkStatusResponse
	_ = json.Unmarshal(raw, &cr)

	return provider.VerifyResponse{
		Success: cr.Status == "auth" || cr.Status == "charge",
		Status:  cr.Status,
		Raw:     string(raw),
	}, nil
}

func (h *halykProvider) RefundPayment(_ context.Context, _ string) error {
	return fmt.Errorf("halyk: refunds require manual processing via the Halyk merchant portal")
}
