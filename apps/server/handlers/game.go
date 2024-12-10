package handlers

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"uno-game/server/types"
	"uno-game/server/utils"

	"github.com/gorilla/websocket"
)

var (
	gameClients = make(map[*types.GameClient]bool)
	gameMutex   sync.RWMutex

	gameBroadcast = make(chan types.GameMessage)
)

func HandleGameConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		utils.LogError("Failed to upgrade game connection", err, "")
		return
	}
	defer ws.Close()

	gameId := r.URL.Query().Get("gameId")
	if gameId == "" {
		utils.LogError("Connection attempt", fmt.Errorf("no game ID provided"), "")
		return
	}

	client := &types.GameClient{Conn: ws, GameId: gameId}

	gameMutex.Lock()
	gameClients[client] = true
	clientCount := len(gameClients)
	gameMutex.Unlock()

	utils.LogClient("CONNECT", "Game", clientCount, gameId)

	defer func() {
		gameMutex.Lock()
		delete(gameClients, client)
		clientCount := len(gameClients)
		gameMutex.Unlock()
		utils.LogClient("DISCONNECT", "Game", clientCount, gameId)
	}()

	for {
		var msg types.GameMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				utils.LogError("Unexpected game connection close", err, gameId)
			}
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		msg.GameId = gameId
		utils.LogMessage("GAME", "RECEIVED", msg, gameId)
		gameBroadcast <- msg
	}
}

func HandleGameMessages() {
	for msg := range gameBroadcast {
		utils.LogMessage("GAME", "BROADCASTING", msg, msg.GameId)
		gameMutex.RLock()
		for client := range gameClients {
			if client.GameId == msg.GameId {
				err := client.Conn.WriteJSON(msg)
				if err != nil {
					utils.LogError("Broadcasting to game client", err, msg.GameId)
					client.Conn.Close()
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
