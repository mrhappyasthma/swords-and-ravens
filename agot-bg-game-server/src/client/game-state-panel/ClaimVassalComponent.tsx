import React, { Component, ReactNode } from "react";
import { observer } from "mobx-react";
import GameStateComponentProps from "./GameStateComponentProps";
import ClaimVassalGameState from "../../common/ingame-game-state/planning-game-state/claim-vassals-game-state/claim-vassal-game-state/ClaimVassalGameState";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";

@observer
export default class ClaimVassalComponent extends Component<GameStateComponentProps<ClaimVassalGameState>> {
    render(): ReactNode {
        return (
            <>
                <Col xs={12} className="text-center">
                    <strong>{this.props.gameState.house.name}</strong> may command a Vassal house this turn.
                </Col>
                <Col xs={12} className="text-center">
                    {this.props.gameClient.doesControlHouse(this.props.gameState.house) ? (
                        <Row className="justify-content-center">
                            {this.props.gameState.getClaimableVassals().map(h => (
                                <Col xs="auto" key={h.id}>
                                    <Button onClick={() => this.props.gameState.choose(h)}>{h.name}</Button>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <>Waiting for {this.props.gameState.house.name}...</>
                    )}
                </Col>
            </>
        );
    }
}
