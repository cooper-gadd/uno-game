package types

import "github.com/gorilla/websocket"

type LobbyClient struct {
	Conn *websocket.Conn
}

type GameClient struct {
	Conn   *websocket.Conn
	GameId string
}
