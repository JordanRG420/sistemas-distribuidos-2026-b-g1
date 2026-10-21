// Package metrics is a minimal, dependency-free stand-in for a
// Prometheus client library (this workshop environment cannot fetch
// external Go modules). It exposes exactly the two golden signals CP3
// asks for — a request counter by outcome and a latency histogram — in
// the same Prometheus text exposition format a real client would write,
// so /metrics can be scraped the same way.
//
// Label cardinality is bounded on purpose: "route" is one of a small,
// fixed set of route patterns (never a raw URL or an ID), and "outcome"
// is "success" or "error" — the same rule CP4 (04-metrics.md) will make
// explicit for the rest of the system's metrics.
package metrics

import (
	"fmt"
	"io"
	"sort"
	"sync"
)

// Buckets are the histogram boundaries, in seconds. 50ms to 5s covers a
// product lookup comfortably while still catching a slow downstream call
// (cross-cutting.md §8 bounds every outgoing HTTP call to 5s).
var Buckets = []float64{0.05, 0.1, 0.25, 0.5, 1, 2.5, 5}

// Registry holds both metrics. A production build would swap this for
// github.com/prometheus/client_golang without changing the call sites in
// handler code (IncRequest / ObserveLatency) — that boundary is the
// point of keeping this package small.
type Registry struct {
	mu sync.Mutex

	requestsTotal map[[2]string]int64 // key: [route, outcome]

	latencyBuckets map[string][]int64 // key: route; cumulative counts, one per Buckets entry plus +Inf
	latencySum     map[string]float64
	latencyCount   map[string]int64
}

func NewRegistry() *Registry {
	return &Registry{
		requestsTotal: make(map[[2]string]int64),
		latencyBuckets: make(map[string][]int64),
		latencySum:     make(map[string]float64),
		latencyCount:   make(map[string]int64),
	}
}

// IncRequest implements the "requests by outcome" golden signal
// (errors + traffic in one counter).
func (r *Registry) IncRequest(route, outcome string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.requestsTotal[[2]string{route, outcome}]++
}

// ObserveLatency implements the latency golden signal. Each observation
// increments every bucket whose boundary is greater than or equal to the
// value, which is the cumulative semantic Prometheus histograms use —
// bucket{le="0.5"} already counts everything at or below 0.5s.
func (r *Registry) ObserveLatency(route string, seconds float64) {
	r.mu.Lock()
	defer r.mu.Unlock()

	buckets, ok := r.latencyBuckets[route]
	if !ok {
		buckets = make([]int64, len(Buckets)+1) // last slot is +Inf
		r.latencyBuckets[route] = buckets
	}
	for i, le := range Buckets {
		if seconds <= le {
			buckets[i]++
		}
	}
	buckets[len(Buckets)]++ // +Inf always counts every observation

	r.latencySum[route] += seconds
	r.latencyCount[route]++
}

// WriteText renders both metrics in Prometheus text exposition format.
func (r *Registry) WriteText(w io.Writer) {
	r.mu.Lock()
	defer r.mu.Unlock()

	fmt.Fprintln(w, "# HELP products_requests_total Count of requests, by route and outcome.")
	fmt.Fprintln(w, "# TYPE products_requests_total counter")
	for _, key := range sortedRequestKeys(r.requestsTotal) {
		fmt.Fprintf(w, "products_requests_total{route=%q,outcome=%q} %d\n", key[0], key[1], r.requestsTotal[key])
	}

	fmt.Fprintln(w, "# HELP products_request_duration_seconds Request latency, by route.")
	fmt.Fprintln(w, "# TYPE products_request_duration_seconds histogram")
	for _, route := range sortedRouteKeys(r.latencyBuckets) {
		buckets := r.latencyBuckets[route]
		for i, le := range Buckets {
			fmt.Fprintf(w, "products_request_duration_seconds_bucket{route=%q,le=\"%g\"} %d\n", route, le, buckets[i])
		}
		fmt.Fprintf(w, "products_request_duration_seconds_bucket{route=%q,le=\"+Inf\"} %d\n", route, buckets[len(Buckets)])
		fmt.Fprintf(w, "products_request_duration_seconds_sum{route=%q} %f\n", route, r.latencySum[route])
		fmt.Fprintf(w, "products_request_duration_seconds_count{route=%q} %d\n", route, r.latencyCount[route])
	}
}

func sortedRequestKeys(m map[[2]string]int64) [][2]string {
	keys := make([][2]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i][0] != keys[j][0] {
			return keys[i][0] < keys[j][0]
		}
		return keys[i][1] < keys[j][1]
	})
	return keys
}

func sortedRouteKeys(m map[string][]int64) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
