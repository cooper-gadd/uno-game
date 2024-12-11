package utils

import (
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"https://uno.cooper-gadd.io",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}

		for _, allowed := range allowedOrigins {
			if strings.EqualFold(origin, allowed) {
				LogMessage("ORIGIN", "ACCEPTED", origin, "")
				return true
			}
		}

		LogMessage("ORIGIN", "REJECTED", origin, "")
		return false
	},
}
