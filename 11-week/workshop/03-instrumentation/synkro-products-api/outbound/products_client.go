// Package outbound represents the one outgoing call of this workshop's
// journey (11-week/workshop/01-journey.md, CP1 step 4): synkro-workflow
// calling synkro-products-api's POST /api/v1/stock-reservations during
// saga step 2 (reserve-stock). The request/response shapes are trimmed
// to what this module needs from
// 07-api/contracts/openapi/synkro-products-api.yaml.
package outbound

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"synkro-w11-instrumentation/tracecontext"
)

// ReserveStockRequest is the saga's request to reserve, in one
// transaction, every line of the sale (contract: StockReservationRequest).
type ReserveStockRequest struct {
	SagaID string             `json:"sagaId"`
	Lines  []ReserveStockLine `json:"lines"`
}

type ReserveStockLine struct {
	ProductID         string `json:"productId"`
	QuantityRequested int    `json:"quantityRequested"`
}

// ReserveStockResponse is trimmed to the one field the saga needs next.
type ReserveStockResponse struct {
	ReservationID string `json:"reservationId"`
}

// Client calls synkro-products-api the way synkro-workflow does: a
// bounded timeout (cross-cutting.md §8: 5s per outgoing call) and the
// caller's own trace context forwarded unchanged on the outgoing
// request — cross-cutting.md §3 rule 4: "every outgoing HTTP call...
// forwards the same X-Correlation-Id, including every saga step".
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{Timeout: 5 * time.Second},
	}
}

// ReserveStock propagates the trace context carried in ctx (set by
// tracecontext.Middleware on the inbound request) onto the outgoing
// call, and sends the saga-step idempotency key
// ("<sagaId>:reserve-stock", cross-cutting.md §7 / Pattern 3 in
// communication-patterns.md) so a retried step reserves nothing twice.
func (c *Client) ReserveStock(ctx context.Context, idempotencyKey string, reqBody ReserveStockRequest) (*ReserveStockResponse, error) {
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("encode reserve-stock request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/api/v1/stock-reservations", bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("build reserve-stock request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Idempotency-Key", idempotencyKey)

	// This line is the propagation CP3 asks for: the trace_id this
	// service received comes back out unchanged, so
	// synkro-products-api's own spans land in the same trace
	// (01-journey.md's span tree; 02-log-contract.md's trace_id field).
	req.Header.Set(tracecontext.CorrelationHeader, tracecontext.TraceIDFrom(ctx))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call synkro-products-api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("stock reservation rejected: %s: %s", resp.Status, body)
	}

	var out ReserveStockResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("decode reserve-stock response: %w", err)
	}
	return &out, nil
}
