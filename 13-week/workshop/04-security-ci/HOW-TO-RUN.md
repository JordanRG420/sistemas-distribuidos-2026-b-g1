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

There is no isolated single-test command for this one: the test boots the
full Spring context over a real HTTP port, so it needs the same disposable
PostgreSQL fixture every other HTTP test in this module needs.

## Notes

- The route has no extra `context-path`; `/api/v1/customers` is correct.
- `security.yml` is a proposal for the team pipeline. It lives in this
  fork and does not change `synkro-customers-api` today.
