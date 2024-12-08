package main

import (
	"log"
	"net/http"
	"sync"
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
	lobbyMutex     sync.RWMutex
	lobbyBroadcast = make(chan LobbyMessage)

	gameClients   = make(map[*GameClient]bool)
	gameMutex     sync.RWMutex
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

	lobbyMutex.Lock()
	lobbyClients[client] = true
	lobbyMutex.Unlock()

	log.Printf("New lobby client connected. Total clients: %d", len(lobbyClients))

	defer func() {
		lobbyMutex.Lock()
		delete(lobbyClients, client)
		lobbyMutex.Unlock()
	}()

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
		lobbyMutex.RLock()
		for client := range lobbyClients {
			err := client.conn.WriteJSON(msg)
			if err != nil {
				log.Printf("Error broadcasting to lobby client: %v", err)
				client.conn.Close()
				lobbyMutex.RUnlock()
				lobbyMutex.Lock()
				delete(lobbyClients, client)
				lobbyMutex.Unlock()
				lobbyMutex.RLock()
			}
		}
		lobbyMutex.RUnlock()
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

	gameMutex.Lock()
	gameClients[client] = true
	gameMutex.Unlock()

	log.Printf("New game client connected to game %s. Total clients: %d", gameId, len(gameClients))

	defer func() {
		gameMutex.Lock()
		delete(gameClients, client)
		gameMutex.Unlock()
	}()

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
		gameMutex.RLock()
		for client := range gameClients {
			if client.gameId == msg.GameId {
				err := client.conn.WriteJSON(msg)
				if err != nil {
					log.Printf("Error broadcasting to game client: %v", err)
					client.conn.Close()
					gameMutex.RUnlock()
					gameMutex.Lock()
					delete(gameClients, client)
					gameMutex.Unlock()
					gameMutex.RLock()
				}
			}
		}
		gameMutex.RUnlock()
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
