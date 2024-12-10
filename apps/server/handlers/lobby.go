package handlers

import (
	"net/http"
	"sync"
	"time"

	"uno-game/server/types"
	"uno-game/server/utils"

	"github.com/gorilla/websocket"
)

var (
	lobbyClients         = make(map[*types.LobbyClient]bool)
	lobbyMutex           sync.RWMutex
	lobbyBroadcast       = make(chan types.LobbyMessage)
	lobbyUpdateBroadcast = make(chan types.LobbyUpdate)
)

func HandleLobbyConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := utils.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		utils.LogError("Failed to upgrade lobby connection", err, "")
		return
	}
	defer ws.Close()

	client := &types.LobbyClient{Conn: ws}

	lobbyMutex.Lock()
	lobbyClients[client] = true
	clientCount := len(lobbyClients)
	lobbyMutex.Unlock()

	utils.LogClient("CONNECT", "Lobby", clientCount, "")

	defer func() {
		lobbyMutex.Lock()
		delete(lobbyClients, client)
		clientCount := len(lobbyClients)
		lobbyMutex.Unlock()
		utils.LogClient("DISCONNECT", "Lobby", clientCount, "")
	}()

	for {
		var msg types.LobbyMessage
		err := ws.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				utils.LogError("Unexpected lobby connection close", err, "")
			}
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		utils.LogMessage("LOBBY", "RECEIVED", msg, "")
		lobbyBroadcast <- msg
	}
}

func HandleLobbyMessages() {
	for msg := range lobbyBroadcast {
		utils.LogMessage("LOBBY", "BROADCASTING", msg, "")
		lobbyMutex.RLock()
		for client := range lobbyClients {
			err := client.Conn.WriteJSON(msg)
			if err != nil {
				utils.LogError("Broadcasting to lobby client", err, "")
				client.Conn.Close()
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

func HandleLobbyUpdateConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := utils.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		utils.LogError("Failed to upgrade lobby update connection", err, "")
		return
	}
	defer ws.Close()

	client := &types.LobbyClient{Conn: ws}

	lobbyMutex.Lock()
	lobbyClients[client] = true
	clientCount := len(lobbyClients)
	lobbyMutex.Unlock()

	utils.LogClient("CONNECT", "Lobby Update", clientCount, "")

	defer func() {
		lobbyMutex.Lock()
		delete(lobbyClients, client)
		clientCount := len(lobbyClients)
		lobbyMutex.Unlock()
		utils.LogClient("DISCONNECT", "Lobby Update", clientCount, "")
	}()

	for {
		var msg types.LobbyUpdate
		err := ws.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				utils.LogError("Unexpected lobby update connection close", err, "")
			}
			break
		}
		utils.LogMessage("LOBBY", "UPDATE RECEIVED", msg, "")
		lobbyUpdateBroadcast <- msg
	}
}

func HandleLobbyUpdates() {
	for msg := range lobbyUpdateBroadcast {
		utils.LogMessage("LOBBY", "UPDATING", msg, "")
		lobbyMutex.RLock()
		for client := range lobbyClients {
			err := client.Conn.WriteJSON(msg)
			if err != nil {
				utils.LogError("Updating lobby client", err, "")
				client.Conn.Close()
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
