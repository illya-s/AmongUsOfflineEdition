import "./Home.css";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useMessageApi } from "../providers/MessageProvider";

import { Section } from "../components/elements/Section";
import { GameAddUserForm, GameConnectForm } from "../components/home/Forms";
import { isPlayerExists } from "../components/requests/api_player";
import { getGame } from "../components/requests/api_game";

export default function Home() {
    const message = useMessageApi();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const qpGame = searchParams.get("game");

    const [game, setGame] = useState(null);
    const [player, setPlayer] = useState(null);

    const setQPGame = async (code) => {
        const game = await getGame(code);
        setGame(game);
    };

    useEffect(() => {
        if (qpGame) {
            setQPGame(qpGame);
        }
    }, []);

    useEffect(() => {
        if (game) {
            navigate(`game/${game.code}`);
        }
    }, [game]);

    useEffect(() => {
        if (player && game?.code && !game.active) {
            localStorage.setItem(game.code, player.id);
            navigate(`game/${game.code}`);
        }
    }, [player]);

    return (
        <Section className="home-start-wrapper">
            <div className="home-start-title-wrapper">
                <h1>Among Us</h1>
                <span>
                    {[..."Offline Edition"].map((char, i) => (
                        <div key={`char${i}_${char}`}>{char}</div>
                    ))}
                </span>
            </div>

            <div>
                <GameConnectForm setGame={setGame} />
            </div>
        </Section>
    );
}
