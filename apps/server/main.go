package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type LobbyClient struct {
	conn *websocket.Conn
}

type LobbyMessage struct {
	Name    string    `json:"name"`
	Message string    `json:"message"`
	SentAt  time.Time `json:"sentAt"`
}

type GameClient struct {
	conn   *websocket.Conn
	gameId string
}

type GameMessage struct {
	Name    string    `json:"name"`
	Message string    `json:"message"`
	SentAt  time.Time `json:"sentAt"`
	GameId  string    `json:"gameId"`
}

var (
	lobbyClients   = make(map[*LobbyClient]bool)
	lobbyBroadcast = make(chan LobbyMessage)

	gameClients   = make(map[*GameClient]bool)
	gameBroadcast = make(chan GameMessage)
)

func handleLobbyConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade lobby connection: %v", err)
		return
	}
	defer ws.Close()

	client := &LobbyClient{conn: ws}
	lobbyClients[client] = true
	log.Printf("New lobby client connected. Total clients: %d", len(lobbyClients))
	defer delete(lobbyClients, client)

	for {
		var msg LobbyMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading lobby message: %v", err)
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		log.Printf("Received lobby message: %v", msg)
		lobbyBroadcast <- msg
	}
}

func handleLobbyMessages() {
	for msg := range lobbyBroadcast {
		log.Printf("Broadcasting lobby message: %v", msg)
		for client := range lobbyClients {
			err := client.conn.WriteJSON(msg)
			if err != nil {
				log.Printf("Error broadcasting to lobby client: %v", err)
				client.conn.Close()
				delete(lobbyClients, client)
			}
		}
	}
}

func handleGameConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade game connection: %v", err)
		return
	}
	defer ws.Close()

	gameId := r.URL.Query().Get("gameId")
	if gameId == "" {
		log.Printf("No game ID provided")
		return
	}

	client := &GameClient{conn: ws, gameId: gameId}
	gameClients[client] = true
	log.Printf("New game client connected to game %s. Total clients: %d", gameId, len(gameClients))
	defer delete(gameClients, client)

	for {
		var msg GameMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading game message: %v", err)
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		msg.GameId = gameId
		log.Printf("Received game message: %v", msg)
		gameBroadcast <- msg
	}
}

func handleGameMessages() {
	for msg := range gameBroadcast {
		log.Printf("Broadcasting game message: %v", msg)
		for client := range gameClients {
			if client.gameId == msg.GameId {
				err := client.conn.WriteJSON(msg)
				if err != nil {
					log.Printf("Error broadcasting to game client: %v", err)
					client.conn.Close()
					delete(gameClients, client)
				}
			}
		}
	}
}

func main() {
	log.Printf("Initializing WebSocket server...")

	http.HandleFunc("/chat", handleLobbyConnections)
	go handleLobbyMessages()

	http.HandleFunc("/game-chat", handleGameConnections)
	go handleGameMessages()

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
