# How to run the negative authorization test

Covers issue #283 ("[security] INVENTORY cannot read or change customer
data"), acceptance criterion 1: an INVENTORY token calling
`GET /api/v1/customers` must receive `403`, with no customer data in the
response body.

## Local run

Place `CustomersAuthorizationNegativeTest.java` at
`customers-app/src/test/java/co/edu/corhuila/synkro/customers/app/` inside
`synkro-customers-api`, then run the project's own real-PostgreSQL suite
(Node 22 + Docker required; it provisions the disposable database and
builds/tests with Maven/Java 21):

```
node tests/verify.mjs
```

## Console output (actual run, 2026-10-31)

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running co.edu.corhuila.synkro.customers.app.CustomersAuthorizationNegativeTest
...Spring Boot context started on a random port (Tomcat)...
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 9.491 s -- in co.edu.corhuila.synkro.customers.app.CustomersAuthorizationNegativeTest
[INFO] Running co.edu.corhuila.synkro.customers.app.ConfigurationTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.076 s -- in co.edu.corhuila.synkro.customers.app.ConfigurationTest
[INFO] Running co.edu.corhuila.synkro.customers.app.JdbcPersistenceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.608 s -- in co.edu.corhuila.synkro.customers.app.JdbcPersistenceTest
[INFO] Running co.edu.corhuila.synkro.customers.app.LifecycleHttpTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.548 s -- in co.edu.corhuila.synkro.customers.app.LifecycleHttpTest

[INFO] Results:
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0

[INFO] synkro-customers-api ............................... SUCCESS [  4.465 s]
[INFO] customers-core ..................................... SUCCESS [ 16.806 s]
[INFO] customers-adapters ................................. SUCCESS [  4.595 s]
[INFO] customers-app ...................................... SUCCESS [ 29.035 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:01 min
[INFO] Finished at: 2026-10-31T05:22:42Z
```

17 tests total, 0 failures, 0 errors, 0 skipped (combines
`CustomersAuthorizationNegativeTest`: 1, `ConfigurationTest`: 3,
`JdbcPersistenceTest`: 4, `LifecycleHttpTest`: 9). Coverage gates also
passed: domain 100%, application 100%, infrastructure 96.1%, overall 97%,
each above its required threshold. The disposable PostgreSQL fixture and
its Flyway migrations provisioned correctly, and fixture cleanup finished
`PASS`.

## YAML validation

Validated `security.yml` with a YAML parser (`python3 -c
"yaml.safe_load(...)"`). Found and fixed one real issue: the bare `on:`
key parses as the boolean `True` under YAML 1.1 (not the string `"on"`),
so it was quoted as `"on":`. After the fix, the document parses with the
correct top-level keys (`name`, `on`, `jobs`) and all three jobs
(`secret-scan`, `dependency-audit`, `authorization-tests`) resolve with
their expected step counts (2, 3, 4).

## Notes

- The route has no extra `context-path`; `/api/v1/customers` is correct.
- `security.yml` is a proposal for the team pipeline. It lives in this
  fork and does not change `synkro-customers-api` today.