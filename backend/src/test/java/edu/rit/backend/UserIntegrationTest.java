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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String getRegistrationToken() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/auth/registration-token"));
        result.andExpect(status().isOk());
        String body = result.andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(body);
        return node.get("token").asText();
    }

    private String registerAndGetAccessToken(String username) throws Exception {
        String registrationToken = getRegistrationToken();
        String body = """
                {
                    "username": "%s",
                    "password": "test123",
                    "registrationToken": "%s"
                }
                """.formatted(username, registrationToken);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        return node.get("accessToken").asText();
    }

    private String uniqueUsername(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void getMeAndGetByIdShouldReturnAvatarId() throws Exception {
        String token = registerAndGetAccessToken(uniqueUsername("avatardef-"));

        String meResponse = mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarId").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long userId = objectMapper.readTree(meResponse).get("id").asLong();

        mockMvc.perform(get("/api/users/{id}", userId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarId").value(1));
    }

    @Test
    void patchAvatarShouldUpdateAndReturnUpdatedUser() throws Exception {
        String token = registerAndGetAccessToken(uniqueUsername("avatarupd-"));

        mockMvc.perform(patch("/api/me/avatar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "avatarId": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarId").value(2));

        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarId").value(2));
    }

    @Test
    void patchAvatarWithInvalidValueShouldReturn400() throws Exception {
        String token = registerAndGetAccessToken(uniqueUsername("avatarbad-"));

        mockMvc.perform(patch("/api/me/avatar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "avatarId": 9
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchAvatarWithoutTokenShouldReturn401() throws Exception {
        mockMvc.perform(patch("/api/me/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "avatarId": 2
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }
}
