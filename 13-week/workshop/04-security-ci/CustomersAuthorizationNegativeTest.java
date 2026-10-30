package com.synkrotech.customers.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Covers issue #283 ("[security] INVENTORY cannot read or change customer
// data"), acceptance criterion 1 — an INVENTORY token must get 403.
@SpringBootTest
@AutoConfigureMockMvc
class CustomersAuthorizationNegativeTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void inventoryTokenIsForbiddenFromListingCustomers() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_INVENTORY"))))
            .andExpect(status().isForbidden());
    }
}
