package co.edu.corhuila.synkro.customers.app;

// Target path in synkro-customers-api:
// customers-app/src/test/java/co/edu/corhuila/synkro/customers/app/
// Covers issue #283 ("[security] INVENTORY cannot read or change customer
// data"), acceptance criterion 1: GET /api/v1/customers with a valid
// INVENTORY token must return 403, not customer data. The signed token
// carries roles=[INVENTORY] as a real claim, because Caller.authorize()
// reads that claim directly — Spring GrantedAuthority objects are never
// consulted by this service's SecurityConfiguration.

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.*;
import java.net.URI;
import java.net.http.*;
import java.security.*;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CustomersAuthorizationNegativeTest {
    static final ObjectMapper JSON = new ObjectMapper();
    static final KeyPair KEYS = keys();
    @LocalServerPort int port;
    final HttpClient client = HttpClient.newHttpClient();

    static KeyPair keys() {
        try { var g = KeyPairGenerator.getInstance("RSA"); g.initialize(2048); return g.generateKeyPair(); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry p) {
        p.add("JWT_PUBLIC_KEY", () -> "-----BEGIN PUBLIC KEY-----\n"
            + Base64.getEncoder().encodeToString(KEYS.getPublic().getEncoded()) + "\n-----END PUBLIC KEY-----");
        p.add("SPRING_DATASOURCE_URL", () -> System.getenv("TEST_DATABASE_URL"));
        p.add("SPRING_DATASOURCE_USERNAME", () -> "customers_app");
        p.add("SPRING_DATASOURCE_PASSWORD", () -> System.getenv("TEST_DATABASE_PASSWORD"));
    }

    String inventoryToken() throws Exception {
        var claims = Map.of("sub", UUID.randomUUID().toString(), "roles", List.of("INVENTORY"),
            "permissions", List.of(), "iat", Instant.now().getEpochSecond() - 60,
            "exp", Instant.now().getEpochSecond() + 3600, "jti", UUID.randomUUID().toString());
        var b = Base64.getUrlEncoder().withoutPadding();
        String input = b.encodeToString(JSON.writeValueAsBytes(Map.of("alg", "RS256")))
            + "." + b.encodeToString(JSON.writeValueAsBytes(claims));
        var s = Signature.getInstance("SHA256withRSA");
        s.initSign(KEYS.getPrivate());
        s.update(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        return input + "." + b.encodeToString(s.sign());
    }

    @Test void inventoryTokenIsForbiddenFromListingCustomers() throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/customers"))
            .header("Authorization", "Bearer " + inventoryToken()).GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(response.body()).doesNotContain("identityDocument");
    }
}
