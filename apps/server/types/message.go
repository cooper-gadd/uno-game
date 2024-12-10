package types

import "time"

type LobbyMessage struct {
	Name    string    `json:"name"`
	Message string    `json:"message"`
	SentAt  time.Time `json:"sentAt"`
}

type GameMessage struct {
	Name    string    `json:"name"`
	Message string    `json:"message"`
	SentAt  time.Time `json:"sentAt"`
	GameId  string    `json:"gameId"`
}
