# How to run the negative authorization test

Covers issue #283 ("[security] INVENTORY cannot read or change customer
data"), acceptance criterion 1: an INVENTORY token calling
`GET /api/v1/customers` must receive `403`.

## Local run

Inside `synkro-customers-api`:

```
./mvnw test -Dtest=CustomersAuthorizationNegativeTest
```

## Notes

- The exact route depends on the service's `context-path`; adjust the
  path in the test if it differs from `/api/v1/customers`.
- `security.yml` is a proposal for the team pipeline. It lives in this
  fork and does not change `synkro-customers-api` today.
