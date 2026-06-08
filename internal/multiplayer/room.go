package multiplayer

type Room struct {
	ID      string
	World   string
	Players map[string]bool
}

func NewRoom(id, world string) *Room {
	return &Room{ID: id, World: world, Players: map[string]bool{}}
}

func (r *Room) Join(player string) {
	r.Players[player] = true
}

func (r *Room) Leave(player string) {
	delete(r.Players, player)
}
