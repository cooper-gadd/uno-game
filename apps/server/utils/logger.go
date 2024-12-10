package utils

import "log"

func LogClient(action, clientType string, count int, gameId string) {
	if gameId != "" {
		log.Printf("[%s] %s client in game %s (total %s clients: %d)",
			action, clientType, gameId, clientType, count)
	} else {
		log.Printf("[%s] %s client (total %s clients: %d)",
			action, clientType, clientType, count)
	}
}

func LogMessage(msgType, action string, msg interface{}, gameId string) {
	if gameId != "" {
		log.Printf("[%s-%s] Game %s: %+v", msgType, action, gameId, msg)
	} else {
		log.Printf("[%s-%s] %+v", msgType, action, msg)
	}
}

func LogError(context string, err error, gameId string) {
	if gameId != "" {
		log.Printf("[ERROR] %s in game %s: %v", context, gameId, err)
	} else {
		log.Printf("[ERROR] %s: %v", context, err)
	}
}
