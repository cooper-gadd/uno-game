package main

import (
	"log"
	"net/http"
	"os"

	"uno-game/server/handlers"
)

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds)
	log.Printf("[INIT] WebSocket server starting...")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Update your handlers setup
	http.HandleFunc("/lobby-chat", handlers.HandleLobbyConnections)
	go handlers.HandleLobbyMessages()

	http.HandleFunc("/lobby-update", handlers.HandleLobbyUpdateConnections)
	go handlers.HandleLobbyUpdates()

	http.HandleFunc("/game-chat", handlers.HandleGameConnections)
	go handlers.HandleGameMessages()

	http.HandleFunc("/game-update", handlers.HandleGameUpdateConnections)
	go handlers.HandleGameUpdates()

	log.Printf("[INIT] Server listening on :%s", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("[FATAL] ListenAndServe: ", err)
	}
}
