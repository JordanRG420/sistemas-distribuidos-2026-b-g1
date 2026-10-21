// This demo wires tracecontext.Middleware and obslog.Logger together on
// one handler, so the first push of CP3 can be run and inspected, not
// just read. It stands in for one real synkro-products-api route
// (GET /api/v1/products/{id}) without touching the real repository.
package main

import (
	"log"
	"net/http"

	"synkro-w11-instrumentation/obslog"
	"synkro-w11-instrumentation/tracecontext"
)

func main() {
	logger := obslog.New()

	handler := tracecontext.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logger.Info(r.Context(), "product.lookup.started", "Looking up product", 0,
			"productId", "b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
		logger.Info(r.Context(), "product.lookup.completed", "Product lookup completed", 12,
			"productId", "b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40")
	}))

	http.Handle("/api/v1/products/demo", handler)
	log.Println("listening on :8089")
	log.Fatal(http.ListenAndServe(":8089", nil))
}
