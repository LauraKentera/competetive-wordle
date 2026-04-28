package edu.rit.backend;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FriendIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String getRegistrationToken() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/auth/registration-token"));
        result.andExpect(status().isOk());
        String body = result.andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    private String registerAndGetToken(String username) throws Exception {
        String registrationToken = getRegistrationToken();
        String body = """
                {
                    "username": "%s",
                    "password": "test1234",
                    "registrationToken": "%s"
                }
                """.formatted(username, registrationToken);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("accessToken").asText();
    }

    private long getUserId(String token) throws Exception {
        String response = mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void sendRequest_shouldCreatePendingFriendship() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-send-a-"));
        String tokenB = registerAndGetToken(unique("fr-send-b-"));
        long userBId = getUserId(tokenB);

        mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void sendRequest_toSelf_shouldReturn400() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-self-"));
        long selfId = getUserId(tokenA);

        mockMvc.perform(post("/api/friends/request/{id}", selfId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendDuplicateRequest_shouldReturn409() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-dup-a-"));
        String tokenB = registerAndGetToken(unique("fr-dup-b-"));
        long userBId = getUserId(tokenB);

        mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isConflict());
    }

    @Test
    void getPendingRequests_shouldReturnOnlyIncomingRequests() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-pend-a-"));
        String tokenB = registerAndGetToken(unique("fr-pend-b-"));
        long userBId = getUserId(tokenB);

        mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // B should see 1 pending request
        mockMvc.perform(get("/api/friends/pending")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        // A should see 0 pending requests (A is requester, not addressee)
        mockMvc.perform(get("/api/friends/pending")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void acceptRequest_byAddressee_shouldReturnAccepted() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-acc-a-"));
        String tokenB = registerAndGetToken(unique("fr-acc-b-"));
        long userBId = getUserId(tokenB);

        String requestResponse = mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();

        mockMvc.perform(post("/api/friends/accept/{id}", friendshipId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void acceptRequest_byNonAddressee_shouldReturn403() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-403-a-"));
        String tokenB = registerAndGetToken(unique("fr-403-b-"));
        String tokenC = registerAndGetToken(unique("fr-403-c-"));
        long userBId = getUserId(tokenB);

        String requestResponse = mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();

        // C is neither requester nor addressee
        mockMvc.perform(post("/api/friends/accept/{id}", friendshipId)
                        .header("Authorization", "Bearer " + tokenC))
                .andExpect(status().isForbidden());
    }

    @Test
    void getFriends_shouldReturnAcceptedFriendsInBothDirections() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-list-a-"));
        String tokenB = registerAndGetToken(unique("fr-list-b-"));
        long userBId = getUserId(tokenB);

        String requestResponse = mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();

        mockMvc.perform(post("/api/friends/accept/{id}", friendshipId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk());

        // Both A and B should see each other in /api/friends
        mockMvc.perform(get("/api/friends").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/friends").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void deleteFriend_shouldRemoveFriendship() throws Exception {
        String tokenA = registerAndGetToken(unique("fr-del-a-"));
        String tokenB = registerAndGetToken(unique("fr-del-b-"));
        long userBId = getUserId(tokenB);

        String requestResponse = mockMvc.perform(post("/api/friends/request/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        long friendshipId = objectMapper.readTree(requestResponse).get("id").asLong();

        mockMvc.perform(post("/api/friends/accept/{id}", friendshipId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/friends/{id}", userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/friends").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void noToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/friends"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/friends/request/1"))
                .andExpect(status().isUnauthorized());
    }
}
