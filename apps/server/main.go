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

type Client struct {
	conn *websocket.Conn
	room string
}

type Message struct {
	Name    string    `json:"name"`
	Message string    `json:"message"`
	SentAt  time.Time `json:"sentAt"`
}

var (
	clients   = make(map[*Client]bool)
	broadcast = make(chan Message)
)

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer ws.Close()

	room := r.URL.Query().Get("room")
	log.Printf("New connection in room: %s", room)

	client := &Client{conn: ws, room: room}
	clients[client] = true
	log.Printf("Client connected to room %s. Total clients: %d", room, len(clients))
	defer delete(clients, client)

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading message from client in room %s: %v", room, err)
			break
		}
		if msg.SentAt.IsZero() {
			msg.SentAt = time.Now().UTC()
		}
		log.Printf("Received message in room %s: %v", room, msg)
		broadcast <- msg
	}
}

func handleMessages() {
	for msg := range broadcast {
		log.Printf("Broadcasting message: %v", msg)
		for client := range clients {
			err := client.conn.WriteJSON(msg)
			if err != nil {
				log.Printf("Error broadcasting to client in room %s: %v", client.room, err)
				client.conn.Close()
				delete(clients, client)
			}
		}
	}
}

func main() {
	log.Printf("Initializing WebSocket server...")
	http.HandleFunc("/chat", handleConnections)
	go handleMessages()

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
