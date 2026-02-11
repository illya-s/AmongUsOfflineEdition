class GameLogicError(Exception):
    code = "game_error"
    message = "Ошибка логики игры"

    def __init__(self, message: str | None = None):
        if message:
            self.message = message
        super().__init__(self.message)


class GameAlreadyStartedError(GameLogicError):
    code = "game_already_started"
    message = "Игра уже запущена. Изменение настроек недоступно"


class NotEnoughPlayersError(GameLogicError):
    code = "not_enough_players"
    message = "Недостаточно игроков для начала игры"


class NotEnoughTasksError(GameLogicError):
    code = "not_enough_tasks"
    message = "Недостаточно задач для распределения между игроками"


class PlayerRoleNotAssignedError(GameLogicError):
    code = "player_role_not_assigned"
    message = "Не всем игрокам назначены роли"


class NoImposterAssignedError(GameLogicError):
    code = "no_imposter_assigned"
    message = "В игре должен быть хотя бы один самозванец"


class ValidationError(GameLogicError):
    code = "validation_error"
    message = "Ошибка проверки формы"
