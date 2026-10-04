# TDD Guide — Test-Driven Development

> TDD is not about testing — it is about **design**. Writing the test first forces you to think
> about the interface before the implementation. The result: simpler, more decoupled code
> with a test suite that documents system behavior.

> **Stack note:** The principles and cycle described here apply to both of this
> project's languages. Concrete tools and commands are in:
> - Java + Spring Boot → `_stacks/java-spring.md`
> - Go → `_stacks/go.md`
>
> Coverage thresholds, the test pyramid and CI integration are in
> `11-quality/testing-strategy.md` — this guide is about the cycle and the
> technique, that document is about what to run and how much of it is
> required.

---

## The Red-Green-Refactor cycle

```
        ┌──────────────────────────────────────────────────────────┐
        │                                                          │
        ▼                                                          │
   ┌─────────┐                                                     │
   │   RED   │  Write the smallest test that can fail.             │
   │  🔴     │  Do NOT implement anything yet.                     │
   └────┬────┘  The test must fail for the right reason.           │
        │                                                          │
        ▼                                                          │
   ┌─────────┐                                                     │
   │  GREEN  │  Write the MINIMUM code to make the test pass.      │
   │  🟢     │  Do not aim for elegance here. Just make it pass.   │
   └────┬────┘                                                     │
        │                                                          │
        ▼                                                          │
   ┌──────────────┐                                                │
   │   REFACTOR   │  Improve code without changing behavior.       │
   │  ♻️          │  Tests must remain green.                      │
   └──────────────┘                                                │
        │                                                          │
        └──────────────────────────────────────────────────────────┘
```

**The rule of 3 moments:**
1. `RED`: The test fails — confirms the test can detect the bug
2. `GREEN`: The test passes — the code does the bare minimum needed
3. `REFACTOR`: The code is clean — no duplication, well named

---

## The 3 testing principles (FIRST)

Good tests are:

| Letter | Principle | Description |
|--------|-----------|-------------|
| **F** | Fast | Run in milliseconds, not seconds |
| **I** | Isolated | Do not depend on other tests or execution order |
| **R** | Repeatable | Same result every time, regardless of environment |
| **S** | Self-validating | Pass / Fail without manual interpretation |
| **T** | Timely | Written BEFORE the code, not after |

---

## Test Doubles: the complete taxonomy

When the application layer needs a collaborator through a port (a
repository, an HTTP client), we replace it in tests with a double. Not
all doubles are the same:

### 1. Dummy
Does nothing. Passed to satisfy a constructor but never called.

**Java:**
```java
IdGenerator dummyIds = null; // never invoked in this test path
var service = new CustomerService(repository, dummyIds);
```

**Go:**
```go
var dummyIDs out.IDGenerator // nil, never called in this test path
uc := NewProducts(repo, dummyIDs)
```

### 2. Stub
Returns a hardcoded response. No call verification.

**Java:**
```java
class StubPasswordHasher implements PasswordHasher {
    @Override
    public String hash(String plaintext) {
        return "stubbed-hash"; // always the same, controls the scenario
    }
}
```

**Go:**
```go
type stubIDGenerator struct{}

func (s stubIDGenerator) NewID() string { return "fixed-id" }
```

### 3. Fake
A real but simplified implementation. Has state, behaves correctly but
lightweight — this is the kind this project uses the most, because it is
the only double that can prove idempotent behavior (calling it twice with
the same key returns the same result).

**Java** (`auth-core/src/test/java/…/application/usecase/FakeUserRepository.java`):
```java
class FakeUserRepository implements UserRepository {
    private final Map<String, String> idByKey = new HashMap<>();

    @Override
    public Created createOnce(String idempotencyKey, User user) {
        String existing = idByKey.get(idempotencyKey);
        if (existing != null) return new Created(existing, false);
        idByKey.put(idempotencyKey, user.id());
        return new Created(user.id(), true);
    }
}
```

**Go** (`internal/application/usecase/products_test.go`):
```go
type fakeProducts struct {
    idByKey map[string]string
}

func (f *fakeProducts) CreateOnce(_ context.Context, key string, p model.Product) (string, bool, error) {
    if id, ok := f.idByKey[key]; ok {
        return id, false, nil
    }
    f.idByKey[key] = p.ID
    return p.ID, true, nil
}
```

### 4. Spy
Records the calls it receives, so the test can verify it was called and
with what.

**Java:**
```java
class SpyPasswordHasher implements PasswordHasher {
    final List<String> hashedValues = new ArrayList<>();

    @Override
    public String hash(String plaintext) {
        hashedValues.add(plaintext);
        return "hash-of-" + plaintext;
    }
}
// In the test:
assertThat(spyHasher.hashedValues).containsExactly("plaintext-password");
```

**Go:**
```go
type spyTokenIssuer struct {
    issuedFor []string
}

func (s *spyTokenIssuer) Issue(service string) (string, error) {
    s.issuedFor = append(s.issuedFor, service)
    return "token-" + service, nil
}
```

### 5. Mock
Has pre-programmed expectations and fails the test if not called exactly
as expected. Used sparingly in this project — a Fake is almost always
clearer and more robust to refactoring, per the "Why Fakes over Mocks"
note below.

**Java (Mockito):**
```java
@Test
void should_call_the_repository_exactly_once() {
    CustomerRepository mockRepo = mock(CustomerRepository.class);
    when(mockRepo.createOnce(any(), any())).thenReturn(new Created("c-1", true));

    new CustomerService(mockRepo, () -> "c-1").create(someCommand);

    verify(mockRepo, times(1)).createOnce(any(), any());
}
```

**Go (testify/mock):**
```go
type mockRepository struct{ mock.Mock }

func (m *mockRepository) CreateOnce(ctx context.Context, key string, p model.Product) (string, bool, error) {
    args := m.Called(ctx, key, p)
    return args.String(0), args.Bool(1), args.Error(2)
}
```

**Why Fakes over Mocks in this project:** Mocks are fragile — they break
if you refactor the internal implementation (how many times a method is
called, in what order) rather than the observable behavior. A Fake only
breaks if the actual *behavior* changes, which is what TDD should protect.
`testing-strategy.md`'s examples use Fakes for exactly this reason.

---

## TDD by layer (with Hexagonal Architecture)

### Layer 1: Domain — Unit tests for entities

These are the most valuable tests. They test pure business logic.
**No port doubles. No database. No HTTP.**

**Java** (`auth-core/src/test/java/…/domain/model/SystemUserTest.java`):
```java
class SystemUserTest {

    @Test
    void should_reject_creation_when_role_is_SERVICE() {
        assertThatThrownBy(() ->
            SystemUser.create("Alice", "alice@test.com", "hash", "SERVICE"))
            .isInstanceOf(DomainException.class)
            .hasMessageContaining("SERVICE is not a valid person role");
    }

    @Test
    void should_default_to_active_on_creation() {
        var user = SystemUser.create("Alice", "alice@test.com", "hash", "ADMIN");
        assertThat(user.active()).isTrue();
    }
}
```

**Go** (`internal/domain/model/product_test.go`):
```go
func TestNewProduct_RejectsZeroPrice(t *testing.T) {
    _, err := model.NewProduct("p-1", "Mouse", 0, "c-1")
    require.ErrorIs(t, err, model.ErrPriceNotPositive)
}

func TestNewProduct_StartsAtZeroStock(t *testing.T) {
    p, err := model.NewProduct("p-1", "Mouse", 45_990_00, "c-1")
    require.NoError(t, err)
    assert.Equal(t, 0, p.Stock)
}
```

**TDD step:**
1. 🔴 Write `should_reject_creation_when_role_is_SERVICE` — fails because the
   check does not exist yet
2. 🟢 Add the minimum validation inside the constructor
3. ♻️ Extract the list of valid roles into a named constant if it is
   checked in more than one place

---

### Layer 2: Application — Use case tests

Test orchestration. Use Fakes for the ports (repositories, ID generators,
token issuers).

**Java:**
```java
class RegisterUserUseCaseTest {

    @Test
    void should_hash_password_and_persist_user() {
        var userRepo = new FakeUserRepository();
        var hasher = new SpyPasswordHasher();
        var useCase = new RegisterUserUseCase(userRepo, hasher);

        var result = useCase.execute("Alice", "alice@test.com", "plaintext", "ADMIN");

        assertThat(result.email()).isEqualTo("alice@test.com");
        assertThat(hasher.hashedValues).containsExactly("plaintext");
    }
}
```

**Go:**
```go
func TestCreate_ReturnsTheOriginalProductWhenTheKeyIsRepeated(t *testing.T) {
    uc := usecase.NewProducts(newFakeProducts(), &sequentialIDs{})
    cmd := in.CreateProductCommand{IdempotencyKey: "key-12345", Name: "Mouse", PriceCents: 45_990_00, CategoryID: "c-1"}

    first, _ := uc.Create(context.Background(), cmd)
    second, err := uc.Create(context.Background(), cmd)

    require.NoError(t, err)
    assert.False(t, second.Created)
    assert.Equal(t, first.ProductID, second.ProductID)
}
```

---

### Layer 3: Infrastructure — HTTP and integration tests

HTTP adapters are tested in memory, with the Fake repository; persistence
adapters are tested against a real PostgreSQL schema. Both are Tier 2 of
`testing-strategy.md`, which has the full examples and the
`TEST_DATABASE_URL` convention.

---

## Suggested order for a new use case

1. Write the domain test first (entity, invariant, typed error)
2. Implement the domain until the test passes
3. Write the use case test, with a Fake for each port
4. Implement the use case
5. Write the HTTP test, with the Fake repository behind it
6. Implement the HTTP adapter
7. Write the integration test against a real schema (`TEST_DATABASE_URL`)
8. Implement the real persistence adapter
9. Refactor at any point while the tests are green

---

## Correlations

- Hexagonal Architecture (what makes a Fake possible) → `05-architecture/hexagonal-architecture.md`
- Test pyramid, tiers, tools and coverage thresholds → `11-quality/testing-strategy.md`
- Definition of Done (coverage is a merge requirement) → `00-governance/definition-of-done.md`
- Stack-specific test folder layout → `_stacks/java-spring.md`, `_stacks/go.md`
