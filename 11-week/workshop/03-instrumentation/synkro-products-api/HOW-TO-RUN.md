# How to Run — CP3 Instrumentation Module (`synkro-products-api`)

> This is a standalone module for the W11 observability workshop. It is
> not wired into the real `synkro-products-api` repository — it
> demonstrates the same middleware/logger/metrics pattern that repository
> would need, built against the real contract of
> `07-api/contracts/openapi/synkro-products-api.yaml` and the real saga
> step documented in `11-week/workshop/01-journey.md`.

## Requirements

- Go 1.24 or newer, no external modules (the standard library only —
  deliberate, so the module builds offline).

## Install

Nothing to install — there is no external dependency to fetch.

```bash
cd 11-week/workshop/03-instrumentation/synkro-products-api
go build ./...
```

## Run the automated test (CP3, second push)

```bash
go test ./... -v -count=1
```

**Real console output from my machine:**

```
?   	synkro-w11-instrumentation/cmd/demo	[no test files]
?   	synkro-w11-instrumentation/metrics	[no test files]
?   	synkro-w11-instrumentation/obslog	[no test files]
=== RUN   TestReserveStock_PropagatesTraceContext
--- PASS: TestReserveStock_PropagatesTraceContext (0.00s)
PASS
ok  	synkro-w11-instrumentation/outbound	0.005s
?   	synkro-w11-instrumentation/tracecontext	[no test files]
```

`TestReserveStock_PropagatesTraceContext` starts an `httptest.Server`
standing in for `synkro-products-api`, sends it an inbound request
carrying `X-Correlation-Id: test-trace-aaa111`, then calls
`outbound.Client.ReserveStock` with that same request's trace context.
The stub server records whatever `X-Correlation-Id` it receives, and the
test fails if that value does not match the trace ID the inbound request
started with — proving the context is forwarded unchanged on the one
outgoing call of this journey (CP1 step 4).

## Run the demo server

```bash
go run ./cmd/demo
```

**Real console output from my machine**, after three `curl` requests to
`http://localhost:8089/api/v1/products/demo`:

```
2026/10/21 00:05:25 listening on :8089
{"timestamp":"2026-10-21T05:05:26.100Z","level":"INFO","message":"Looking up product","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"dccc641f-b276-4916-b08c-8939c6d8c54b","span_id":"3cd77b22","correlation_id":"dccc641f-b276-4916-b08c-8939c6d8c54b","event":"product.lookup.started","duration_ms":0,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
{"timestamp":"2026-10-21T05:05:26.100Z","level":"INFO","message":"Product lookup completed","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"dccc641f-b276-4916-b08c-8939c6d8c54b","span_id":"3cd77b22","correlation_id":"dccc641f-b276-4916-b08c-8939c6d8c54b","event":"product.lookup.completed","duration_ms":0,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
{"timestamp":"2026-10-21T05:05:26.109Z","level":"INFO","message":"Looking up product","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"b73f8ee4-4a8f-481a-a5a3-283944214cfd","span_id":"8e5398cc","correlation_id":"b73f8ee4-4a8f-481a-a5a3-283944214cfd","event":"product.lookup.started","duration_ms":0,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
{"timestamp":"2026-10-21T05:05:26.110Z","level":"INFO","message":"Product lookup completed","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"b73f8ee4-4a8f-481a-a5a3-283944214cfd","span_id":"8e5398cc","correlation_id":"b73f8ee4-4a8f-481a-a5a3-283944214cfd","event":"product.lookup.completed","duration_ms":0,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
{"timestamp":"2026-10-21T05:05:26.117Z","level":"INFO","message":"Looking up product","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"d9290049-60ec-475e-8e09-96262539ef51","span_id":"d3ec8ac4","correlation_id":"d9290049-60ec-475e-8e09-96262539ef51","event":"product.lookup.started","duration_ms":0,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
{"timestamp":"2026-10-21T05:05:26.117Z","level":"INFO","message":"Product lookup completed","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"d9290049-60ec-475e-8e09-96262539ef51","span_id":"d3ec8ac4","correlation_id":"d9290049-60ec-475e-8e09-96262539ef51","event":"product.lookup.completed","duration_ms":0,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
```

Three requests, three different `trace_id` values — each request gets
its own trace because no `X-Correlation-Id` was sent, and each one's two
log lines (`started`/`completed`) share the same `trace_id` and
`span_id`, exactly as the CP2 contract requires for one request.

To see the context reused instead of created, send it explicitly:

```bash
curl -H "X-Correlation-Id: my-own-trace-123" http://localhost:8089/api/v1/products/demo -D -
```

The response's `X-Correlation-Id` header comes back as `my-own-trace-123`
unchanged, and that is the value the logs print as `trace_id`.

## Check the metrics endpoint

```bash
curl http://localhost:8089/metrics
```

**Real console output from my machine**, after the three requests above:

```
# HELP products_requests_total Count of requests, by route and outcome.
# TYPE products_requests_total counter
products_requests_total{route="GET /api/v1/products/{id}",outcome="success"} 3
# HELP products_request_duration_seconds Request latency, by route.
# TYPE products_request_duration_seconds histogram
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="0.05"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="0.1"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="0.25"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="0.5"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="1"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="2.5"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="5"} 3
products_request_duration_seconds_bucket{route="GET /api/v1/products/{id}",le="+Inf"} 3
products_request_duration_seconds_sum{route="GET /api/v1/products/{id}"} 0.000210
products_request_duration_seconds_count{route="GET /api/v1/products/{id}"} 3
```

`products_requests_total` is the counter (by outcome); the four
`products_request_duration_seconds_*` series together are the histogram
(by bucket, sum and count) — the two golden signals CP3 asks for.

## Known issues encountered while building this

- `go get`/`go mod tidy` could not reach `proxy.golang.org` in this
  offline environment, so `github.com/google/uuid` was dropped in favor
  of generating trace and span IDs with the standard library's
  `crypto/rand` — no behavior changed, only the dependency footprint.
- `slog`'s default JSON handler writes `time` and `msg`, not CP2's
  `timestamp` and `message` — fixed with a `ReplaceAttr` function in
  `obslog.New()` instead of hand-building the JSON line.
