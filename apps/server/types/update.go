package types

type LobbyUpdate struct{}

type GameUpdate struct {
	GameId string `json:"gameId"`
}
