package main

import (
	"fmt"
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

func logClient(action, clientType string, count int, gameId string) {
	if gameId != "" {
		log.Printf("[%s] %s client in game %s (total %s clients: %d)",
			action, clientType, gameId, clientType, count)
	} else {
		log.Printf("[%s] %s client (total %s clients: %d)",
			action, clientType, clientType, count)
	}
}

func logMessage(msgType, action string, msg interface{}, gameId string) {
	if gameId != "" {
		log.Printf("[%s-%s] Game %s: %+v", msgType, action, gameId, msg)
	} else {
		log.Printf("[%s-%s] %+v", msgType, action, msg)
	}
}

func logError(context string, err error, gameId string) {
	if gameId != "" {
		log.Printf("[ERROR] %s in game %s: %v", context, gameId, err)
	} else {
		log.Printf("[ERROR] %s: %v", context, err)
	}
}

func handleLobbyConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logError("Failed to upgrade lobby connection", err, "")
		return
	}
	defer ws.Close()

	client := &LobbyClient{conn: ws}

	lobbyMutex.Lock()
	lobbyClients[client] = true
	clientCount := len(lobbyClients)
	lobbyMutex.Unlock()

	logClient("CONNECT", "Lobby", clientCount, "")

	defer func() {
		lobbyMutex.Lock()
		delete(lobbyClients, client)
		clientCount := len(lobbyClients)
		lobbyMutex.Unlock()
		logClient("DISCONNECT", "Lobby", clientCount, "")
	}()

	for {
		var msg LobbyMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				logError("Unexpected lobby connection close", err, "")
			}
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		logMessage("LOBBY", "RECEIVED", msg, "")
		lobbyBroadcast <- msg
	}
}

func handleGameConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logError("Failed to upgrade game connection", err, "")
		return
	}
	defer ws.Close()

	gameId := r.URL.Query().Get("gameId")
	if gameId == "" {
		logError("Connection attempt", fmt.Errorf("no game ID provided"), "")
		return
	}

	client := &GameClient{conn: ws, gameId: gameId}

	gameMutex.Lock()
	gameClients[client] = true
	clientCount := len(gameClients)
	gameMutex.Unlock()

	logClient("CONNECT", "Game", clientCount, gameId)

	defer func() {
		gameMutex.Lock()
		delete(gameClients, client)
		clientCount := len(gameClients)
		gameMutex.Unlock()
		logClient("DISCONNECT", "Game", clientCount, gameId)
	}()

	for {
		var msg GameMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				logError("Unexpected game connection close", err, gameId)
			}
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		msg.GameId = gameId
		logMessage("GAME", "RECEIVED", msg, gameId)
		gameBroadcast <- msg
	}
}

func handleLobbyMessages() {
	for msg := range lobbyBroadcast {
		logMessage("LOBBY", "BROADCASTING", msg, "")
		lobbyMutex.RLock()
		for client := range lobbyClients {
			err := client.conn.WriteJSON(msg)
			if err != nil {
				logError("Broadcasting to lobby client", err, "")
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

func handleGameMessages() {
	for msg := range gameBroadcast {
		logMessage("GAME", "BROADCASTING", msg, msg.GameId)
		gameMutex.RLock()
		for client := range gameClients {
			if client.gameId == msg.GameId {
				err := client.conn.WriteJSON(msg)
				if err != nil {
					logError("Broadcasting to game client", err, msg.GameId)
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
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds)
	log.Printf("[INIT] WebSocket server starting...")

	http.HandleFunc("/chat", handleLobbyConnections)
	go handleLobbyMessages()

	http.HandleFunc("/game-chat", handleGameConnections)
	go handleGameMessages()

	log.Printf("[INIT] Server listening on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("[FATAL] ListenAndServe: ", err)
	}
}
