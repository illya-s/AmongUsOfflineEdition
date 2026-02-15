from typing import Type

from game import handlers, handlers_gameplay, handlers_meeting, handlers_sabotage
from game.request import SocketHandler

handlepatterns: dict[str, Type[SocketHandler]] = {
    # game
    "toggle_auto_assign_role": handlers.ToggleAutoAssignRole,
    "change_game": handlers.ChangeGameHandler,
    "change_map": handlers.ChangeMap,
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
    # gameplay
    "complete_task": handlers_gameplay.CompleteTask,
    "kill_player": handlers_gameplay.KillPlayer,
    # meetings
    "start_emergency_meeting": handlers_meeting.StartEmergencyMeeting,
    "report_body": handlers_meeting.ReportBody,
    "submit_vote": handlers_meeting.SubmitVote,
    "start_meeting_vote": handlers_meeting.StartMeetingVote,
    "end_meeting": handlers_meeting.EndMeeting,
    # sabotages
    "trigger_sabotage": handlers_sabotage.TriggerSabotage,
    "resolve_sabotage": handlers_sabotage.ResolveSabotage,
    # mapping
    # "update_player_location": handlers_gameplay.UpdatePlayerLocation,
}
