package main

import (
	"log"
	"net/http"

	"uno-game/server/handlers"
)

func main() {
    log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds)
    log.Printf("[INIT] WebSocket server starting...")

    http.HandleFunc("/chat", handlers.HandleLobbyConnections)
    go handlers.HandleLobbyMessages()

    http.HandleFunc("/game-chat", handlers.HandleGameConnections)
    go handlers.HandleGameMessages()

    log.Printf("[INIT] Server listening on :8080")
    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        log.Fatal("[FATAL] ListenAndServe: ", err)
    }
}
