package tracecontext

import "net/http"

// Middleware reads or creates the request's trace context and returns it
// on the response — the same rule synkro-products-api's own
// withCorrelation already follows for X-Correlation-Id
// (internal/adapter/in/httpapi/middleware.go), reused here with the
// span_id this workshop's log contract (CP2) adds alongside it.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tc := FromRequest(r)
		w.Header().Set(CorrelationHeader, tc.TraceID)
		next.ServeHTTP(w, r.WithContext(WithContext(r.Context(), tc)))
	})
}
