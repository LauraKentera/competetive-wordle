package edu.rit.backend.game.controller;

import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.game.dto.GuessRequest;
import edu.rit.backend.game.dto.GuessResult;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
public class GameController {

    @PostMapping
    public GameDto createGame() {
        // Dummy response
        return new GameDto(1L, "created");
    }

    @PostMapping("/{id}/guess")
    public GuessResult guess(@PathVariable Long id, @RequestBody GuessRequest request) {
        // Dummy response
        return new GuessResult("incorrect");
    }

    @GetMapping("/{id}")
    public GameDto getGame(@PathVariable Long id) {
        // Dummy response
        return new GameDto(id, "in_progress");
    }
}