package edu.rit.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Obtain a registration token (nonce) from the server, required for register.
     */
    private String getRegistrationToken() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/auth/registration-token"));
        result.andExpect(status().isOk());
        String body = result.andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(body);
        return node.get("token").asText();
    }

    @Test
    void registerShouldReturnToken() throws Exception {
        String registrationToken = getRegistrationToken();
        String body = """
                {
                    "username": "testuser",
                    "password": "test123",
                    "registrationToken": "%s"
                }
                """.formatted(registrationToken);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void loginShouldReturnToken() throws Exception {
        String registrationToken = getRegistrationToken();
        String register = """
                {
                    "username": "loginuser",
                    "password": "test123",
                    "registrationToken": "%s"
                }
                """.formatted(registrationToken);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(register))
                .andExpect(status().isOk());

        String login = """
                {
                    "username": "loginuser",
                    "password": "test123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    void protectedEndpointWithTokenShouldReturn200() throws Exception {
        String registrationToken = getRegistrationToken();
        String register = """
            {
                "username": "secureuser",
                "password": "test123",
                "registrationToken": "%s"
            }
            """.formatted(registrationToken);

        String token = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(register))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = objectMapper.readTree(token);
        String accessToken = node.get("accessToken").asText();

        mockMvc.perform(get("/api/test/secure")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointWithoutTokenShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerWithoutTokenShouldFail() throws Exception {
        String body = """
                {
                    "username": "notokenuser",
                    "password": "test123"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}