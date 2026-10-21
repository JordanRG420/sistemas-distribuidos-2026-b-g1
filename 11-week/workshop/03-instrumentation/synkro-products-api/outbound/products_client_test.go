package outbound

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"synkro-w11-instrumentation/tracecontext"
)

// TestReserveStock_PropagatesTraceContext is CP3's required test: the
// trace_id this service received on its own inbound request must be the
// exact same trace_id it sends on the one outgoing call of its journey
// (CP1 step 4: synkro-workflow -> synkro-products-api,
// POST /api/v1/stock-reservations).
func TestReserveStock_PropagatesTraceContext(t *testing.T) {
	var receivedTraceID string

	// Stub standing in for synkro-products-api: all it does is record
	// the X-Correlation-Id it was sent, the same role CP1's sequence
	// diagram gives that hop.
	stub := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedTraceID = r.Header.Get(tracecontext.CorrelationHeader)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(ReserveStockResponse{
			ReservationID: "11111111-1111-1111-1111-111111111111",
		})
	}))
	defer stub.Close()

	// Simulate the inbound request this service itself received,
	// carrying its own trace context (as if it arrived from the
	// gateway with X-Correlation-Id already set).
	inboundReq := httptest.NewRequest(http.MethodPost, "/sagas/register-sale", nil)
	inboundReq.Header.Set(tracecontext.CorrelationHeader, "test-trace-aaa111")
	tc := tracecontext.FromRequest(inboundReq)
	ctx := tracecontext.WithContext(context.Background(), tc)

	client := NewClient(stub.URL)
	_, err := client.ReserveStock(ctx, "saga-123:reserve-stock", ReserveStockRequest{
		SagaID: "saga-123",
		Lines: []ReserveStockLine{
			{ProductID: "b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40", QuantityRequested: 2},
		},
	})
	if err != nil {
		t.Fatalf("ReserveStock returned an error: %v", err)
	}

	if receivedTraceID != tc.TraceID {
		t.Fatalf("trace_id not propagated: inbound trace_id=%q, downstream received=%q", tc.TraceID, receivedTraceID)
	}
}
