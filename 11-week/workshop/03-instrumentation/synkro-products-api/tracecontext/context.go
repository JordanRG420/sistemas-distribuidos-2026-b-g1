// Package tracecontext builds the minimal trace context a SynkroTech
// service needs: reuse the caller's X-Correlation-Id or create one, keep
// it available through the request's context.Context, and echo it back
// on the response. synkro-products-api's real HTTP adapter already does
// the first half of this (internal/adapter/in/httpapi/middleware.go,
// withCorrelation) per 05-architecture/cross-cutting.md §3; this module
// adds the explicit per-hop span_id that the structured log contract of
// 11-week/workshop/02-log-contract.md (CP2) requires alongside it.
package tracecontext

import (
	"context"
	"crypto/rand"
	"fmt"
	"net/http"
)

// CorrelationHeader is the header name the whole platform agrees on
// (cross-cutting.md §3). Its value doubles as every log line's trace_id.
const CorrelationHeader = "X-Correlation-Id"

type ctxKey int

const (
	traceIDKey ctxKey = iota
	spanIDKey
)

// TraceContext is one span of a distributed trace. TraceID is shared by
// every service that touches the same saga run (e.g. one register-sale
// request); SpanID identifies only this one hop.
type TraceContext struct {
	TraceID string
	SpanID  string
}

// FromRequest reuses the incoming X-Correlation-Id as the trace ID, or
// creates a new one if the caller sent none — normally the gateway
// assigns it, but a service called directly (as in this workshop's
// standalone demo) must still be able to start a trace on its own. A
// fresh span_id is always generated: it names this hop, never the whole
// trace.
func FromRequest(r *http.Request) TraceContext {
	traceID := r.Header.Get(CorrelationHeader)
	if traceID == "" {
		traceID = newTraceID()
	}
	return TraceContext{TraceID: traceID, SpanID: newSpanID()}
}

// newTraceID and newSpanID use only the standard library (no external
// dependency is justified for a module this small). newTraceID is
// formatted like a UUID v4 for readability in logs; newSpanID is a
// shorter 8-byte hex id, matching the style already used in
// 11-week/workshop/01-journey.md's span tree.
func newTraceID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func newSpanID() string {
	var b [4]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("%x", b[:])
}

// WithContext stores the trace context so downstream code (the logger,
// an outgoing HTTP call) can read it without threading it through every
// function signature.
func WithContext(ctx context.Context, tc TraceContext) context.Context {
	ctx = context.WithValue(ctx, traceIDKey, tc.TraceID)
	ctx = context.WithValue(ctx, spanIDKey, tc.SpanID)
	return ctx
}

// TraceIDFrom and SpanIDFrom read back what WithContext stored. Both
// return "" for a context that never went through WithContext: there is
// no trace context to fabricate at that point, and inventing one would
// hide a wiring bug instead of surfacing it.
func TraceIDFrom(ctx context.Context) string {
	id, _ := ctx.Value(traceIDKey).(string)
	return id
}

func SpanIDFrom(ctx context.Context) string {
	id, _ := ctx.Value(spanIDKey).(string)
	return id
}
