// Package obslog writes SynkroTech's structured log line as defined in
// 11-week/workshop/02-log-contract.md (CP2), with trace_id and span_id
// injected from the request's tracecontext. synkro-products-api's real
// logger (cmd/products-api/main.go) already writes JSON to stdout with
// slog, but does not yet inject service/version/environment, trace_id,
// span_id, event or duration_ms — this module is that missing piece,
// built standalone for the workshop.
package obslog

import (
	"context"
	"log/slog"
	"os"

	"synkro-w11-instrumentation/tracecontext"
)

// Service, Version and Environment identify every line this logger
// writes, matching cross-cutting.md §2's "service" field and
// deployment.md §6's environment names. This module stands in for
// synkro-products-api; a different workshop module would set its own.
const (
	Service     = "synkro-products-api"
	Version     = "0.9.4"
	Environment = "develop"
)

// Logger wraps the standard library's slog with the eleven mandatory
// fields CP2 defines.
type Logger struct {
	base *slog.Logger
}

// New builds a Logger that writes one JSON object per line to stdout,
// renaming slog's default "time"/"msg" keys to CP2's "timestamp" and
// "message" instead of carrying both the default and the contract's
// own names.
func New() *Logger {
	opts := &slog.HandlerOptions{
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			switch a.Key {
			case slog.TimeKey:
				a.Key = "timestamp"
				a.Value = slog.StringValue(a.Value.Time().UTC().Format("2006-01-02T15:04:05.000Z"))
			case slog.MessageKey:
				a.Key = "message"
			}
			return a
		},
	}
	return &Logger{base: slog.New(slog.NewJSONHandler(os.Stdout, opts))}
}

// Info, Warn and Error each write one CP2-shaped log line. event is the
// stable, filterable event name (CP2 §1, e.g. "stock_reservation.rejected");
// message is the human-readable text; durationMs is the elapsed time this
// line reports (0 when the line does not close a timed operation); fields
// are the domain attributes of CP2 §2 (sagaId, productId, ...), passed as
// alternating key/value pairs, the same convention slog itself uses.
func (l *Logger) Info(ctx context.Context, event, message string, durationMs int64, fields ...any) {
	l.log(ctx, slog.LevelInfo, event, message, durationMs, fields...)
}

func (l *Logger) Warn(ctx context.Context, event, message string, durationMs int64, fields ...any) {
	l.log(ctx, slog.LevelWarn, event, message, durationMs, fields...)
}

func (l *Logger) Error(ctx context.Context, event, message string, durationMs int64, fields ...any) {
	l.log(ctx, slog.LevelError, event, message, durationMs, fields...)
}

func (l *Logger) log(ctx context.Context, level slog.Level, event, message string, durationMs int64, fields ...any) {
	traceID := tracecontext.TraceIDFrom(ctx)
	attrs := []any{
		"service", Service,
		"version", Version,
		"environment", Environment,
		"trace_id", traceID,
		"span_id", tracecontext.SpanIDFrom(ctx),
		"correlation_id", traceID,
		"event", event,
		"duration_ms", durationMs,
	}
	if len(fields) > 0 {
		attrs = append(attrs, "context", mapFields(fields))
	}
	l.base.Log(ctx, level, message, attrs...)
}

// mapFields turns an alternating key/value slice into the "context"
// object CP2 §2 expects for domain fields (cross-cutting.md §2 already
// reserves "context" for this).
func mapFields(fields []any) map[string]any {
	m := make(map[string]any, len(fields)/2)
	for i := 0; i+1 < len(fields); i += 2 {
		key, ok := fields[i].(string)
		if !ok {
			continue
		}
		m[key] = fields[i+1]
	}
	return m
}
