package multiplayer

import "github.com/Kvnbbg/Laura/internal/protocol"

type Gateway struct {
	Rooms map[string]*Room
}

func NewGateway() *Gateway {
	return &Gateway{Rooms: map[string]*Room{}}
}

func (g *Gateway) EnsureRoom(id, world string) *Room {
	if room, ok := g.Rooms[id]; ok {
		return room
	}
	room := NewRoom(id, world)
	g.Rooms[id] = room
	return room
}

func (g *Gateway) Broadcast(msg protocol.Message) protocol.Message {
	return msg
}
