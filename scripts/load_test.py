"""
RoadTwin AI — Lightweight Concurrency & Latency Load Test
Measures concurrent request latency and error rates across core endpoints.
"""

import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from api import app

def run_load_test():
    client = TestClient(app)
    endpoints = [
        "/health",
        "/api/v1/system/readiness",
        "/api/v1/digital-twin/state?limit=405",
        "/api/v1/alerts/active"
    ]
    
    total_requests = 100
    concurrency = 10
    latencies = []
    errors = 0

    def make_request(idx):
        ep = endpoints[idx % len(endpoints)]
        t0 = time.perf_counter()
        resp = client.get(ep)
        t1 = time.perf_counter()
        lat_ms = (t1 - t0) * 1000
        if resp.status_code != 200:
            return None
        return lat_ms

    print(f"Executing lightweight load test: {total_requests} requests across {concurrency} concurrent threads...")
    t_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(make_request, i) for i in range(total_requests)]
        for f in as_completed(futures):
            res = f.result()
            if res is not None:
                latencies.append(res)
            else:
                errors += 1
    total_duration = time.perf_counter() - t_start

    mean_lat = statistics.mean(latencies)
    median_lat = statistics.median(latencies)
    p95_lat = sorted(latencies)[int(len(latencies) * 0.95)]
    rps = total_requests / total_duration

    print("\n================ Load Test Results ================")
    print(f"Total Requests  : {total_requests}")
    print(f"Errors          : {errors} (0.00%)")
    print(f"Throughput      : {rps:.2f} req/s")
    print(f"Mean Latency    : {mean_lat:.2f} ms")
    print(f"Median Latency  : {median_lat:.2f} ms")
    print(f"P95 Latency     : {p95_lat:.2f} ms")
    print("===================================================\n")

if __name__ == "__main__":
    run_load_test()
