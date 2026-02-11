from typing import Type

from game import handlers
from game.request import SocketHandler

handlepatterns: dict[str, Type[SocketHandler]] = {
    # game
    "toggle_auto_assign_role": handlers.ToggleAutoAssignRole,
    "change_game": handlers.ChangeGameHandler,
    # tasks
    "add_task": handlers.AddTask,
    "change_check_task": handlers.ChangeCheckTask,
    "delete_task": handlers.DeleteTask,
    "update_zones": handlers.UpdateZones,
    # players
    "add_player": handlers.AddPlayer,
    "change_player_role": handlers.ChangePlayerRole,
    "delete_player": handlers.DeletePlayer,
    "get_player": handlers.GetPlayerById,
}
