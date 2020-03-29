import GameClient from "./GameClient";
import { Component, ReactNode } from "react";
import React from "react";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import House from "../common/ingame-game-state/game-data-structure/House";
import { ListGroupItem, Row, Col, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import unitTypes from "..//common/ingame-game-state/game-data-structure/unitTypes";
import unitImages from "./unitImages";
import housePowerTokensImages from "./housePowerTokensImages";
import _ from "lodash";
import { HouseCardState } from "../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import HouseCardComponent from "./game-state-panel/utils/HouseCardComponent";
import HouseCardBackComponent from "./game-state-panel/utils/HouseCardBackComponent";
import Game from "../common/ingame-game-state/game-data-structure/Game";
import castleImage from "../../public/images/icons/castle.svg";
import battleGearImage from "../../public/images/icons/battle-gear.svg";
import Player from "../common/ingame-game-state/Player";


interface HouseRowComponentProps {
    house: House;
    gameClient: GameClient;
    ingame: IngameGameState;
}

export default class HouseRowComponent extends Component<HouseRowComponentProps> {
    get house(): House {
        return this.props.house;
    }

    get game(): Game {
        return this.props.ingame.game;
    }

    get isVassal(): boolean {
        return this.props.ingame.isVassalHouse(this.house);
    }

    get player(): Player {
        return this.props.ingame.getControllerOfHouse(this.house);
    }

    render(): ReactNode {
        return <>
            <ListGroupItem>
                <Row className="align-items-center">
                    <Col xs="auto" className="pr-0" style={{width: "28px"}}>
                        {!this.isVassal ? (
                            <FontAwesomeIcon
                                className={classNames({"invisible": !this.props.gameClient.isAuthenticatedUser(this.player.user)})}
                                style={{color: this.house.color}}
                                icon={faStar}
                            />
                        ) : (
                            <OverlayTrigger
                                placement="right"
                                overlay={
                                    <Tooltip id={"vassal-house-" + this.house.id}>
                                        <strong>Vassal</strong><br />
                                        At the beginning of the Planning Phase,
                                        each player, in order, can pick a vassal to command this turn.
                                    </Tooltip>
                                }
                            >
                                <img src={battleGearImage} width={24} style={{margin: "-4px"}} />
                            </OverlayTrigger>
                        )}
                    </Col>
                    <Col>
                        <b style={{"color": this.house.color}}>{this.house.name}</b><br/>
                        {!this.isVassal ? (
                            <>
                                {" "}
                                <a href={`/user/${this.player.user.id}`} target="_blank" rel="noopener noreferrer">
                                    <small>{this.player.user.name}</small>
                                </a>
                            </>
                        ) : (
                            <small>
                                {this.house.suzerainHouse ? (
                                    <>Commanded by {this.house.suzerainHouse.name}</>
                                ) : (
                                    <>Up for grab</>
                                )}
                            </small>
                        )}
                    </Col>
                    <Col xs="auto">
                        <Row className="justify-content-center align-items-center" style={{width: 110}}>
                            {unitTypes.values.map(type => (
                                <Col xs={6} key={type.id}>
                                    <Row className="justify-content-center no-gutters align-items-center">
                                        <Col xs="auto">
                                            {this.game.getAvailableUnitsOfType(this.house, type)}
                                        </Col>
                                        <Col xs="auto" style={{marginLeft: 4}}>
                                            <div className="unit-icon small hover-weak-outline"
                                                style={{
                                                    backgroundImage: `url(${unitImages.get(this.house.id).get(type.id)})`,
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                    <Col xs="auto" className={classNames("d-flex align-items-center", {"invisible": this.isVassal})}>
                        <div style={{fontSize: "18px"}}>{this.game.getTotalHeldStructures(this.house)}</div>
                        <img
                            src={castleImage} width={32} className="hover-weak-outline"
                            style={{marginLeft: "10px"}}
                        />
                    </Col>
                    <Col xs="auto" className={classNames("d-flex align-items-center", {"invisible": this.isVassal})}>
                        <div style={{fontSize: "18px"}}>{this.house.powerTokens}</div>
                        <div
                            className="house-power-token hover-weak-outline"
                            style={{
                                backgroundImage: `url(${housePowerTokensImages.get(this.house.id)})`,
                                marginLeft: "10px"
                            }}
                        />
                    </Col>
                </Row>
                <Row className="justify-content-center">
                    {_.sortBy(this.house.houseCards.values, hc => hc.combatStrength).map(hc => (
                        <Col xs="auto" key={hc.id}>
                            {hc.state == HouseCardState.AVAILABLE ? (
                                <HouseCardComponent
                                    houseCard={hc}
                                    size="tiny"
                                />
                            ) : (
                                <HouseCardBackComponent
                                    house={this.house}
                                    houseCard={hc}
                                    size="tiny"
                                />
                            )}
                        </Col>
                    ))}
                </Row>
            </ListGroupItem>
        </>;
    }
}