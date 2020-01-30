import {Component, ReactNode} from "react";
import React from "react";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import {GameLogData} from "../common/ingame-game-state/game-data-structure/GameLog";
import Game from "../common/ingame-game-state/game-data-structure/Game";
import HouseCard from "../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import House from "../common/ingame-game-state/game-data-structure/House";
import unitTypes from "../common/ingame-game-state/game-data-structure/unitTypes";
import World from "../common/ingame-game-state/game-data-structure/World";
import UnitType from "../common/ingame-game-state/game-data-structure/UnitType";
import Region from "../common/ingame-game-state/game-data-structure/Region";
import {westerosCardTypes} from "../common/ingame-game-state/game-data-structure/westeros-card/westerosCardTypes";
import {observer} from "mobx-react";
import WildlingCardComponent from "./game-state-panel/utils/WildlingCardComponent";
import WildlingCard from "../common/ingame-game-state/game-data-structure/wildling-card/WildlingCard";
import WesterosCardComponent from "./game-state-panel/utils/WesterosCardComponent";
import _ from "lodash";
import joinReactNodes from "./utils/joinReactNodes";
import orders from "../common/ingame-game-state/game-data-structure/orders";
// @ts-ignore
import autoscroll from "autoscroll-react";
import CombatInfoComponent from "./CombatInfoComponent";

interface GameLogListComponentProps {
    ingameGameState: IngameGameState;
}

@observer
class GameLogListComponent extends Component<GameLogListComponentProps> {
    get game(): Game {
        return this.props.ingameGameState.game;
    }

    get world(): World {
        return this.game.world;
    }

    render(): ReactNode {
        return this.props.ingameGameState.gameLogManager.logs.map((l, i) => (
            <Row key={i}>
                <Col xs="auto" className="text-muted">
                    <small>
                        {l.time.getHours().toString().padStart(2, "0")}
                        :{l.time.getMinutes().toString().padStart(2, "0")}
                    </small>
                </Col>
                <Col>
                    <div className="game-log-content">
                        {this.renderGameLogData(l.data)}
                    </div>
                </Col>
            </Row>
        ));
    }

    renderGameLogData(data: GameLogData): ReactNode {
        switch (data.type) {
            case "turn-begin":
                return <Row className="justify-content-center">
                    <Col xs={true}><hr/></Col>
                    <Col xs="auto">
                        <h4>Turn <b>{data.turn}</b></h4>
                    </Col>
                    <Col xs={true}><hr/></Col>
                </Row>;

            case "support-declared":
                const supporter = this.game.houses.get(data.supporter);
                const supported = data.supported ? this.game.houses.get(data.supported) : null;
                if (supported) {
                    return <><b>{supporter.name}</b> supported <b>{supported.name}</b>.</>;
                } else {
                    return <><b>{supporter.name}</b> supported no-one.</>;
                }

            case "attack":
                const attacker = this.game.houses.get(data.attacker);
                // A "null" for "attacked" means it was an attack against a neutral force
                const attacked = data.attacked ? this.game.houses.get(data.attacked) : null;
                const attackingRegion = this.game.world.regions.get(data.attackingRegion);
                const attackedRegion = this.game.world.regions.get(data.attackedRegion);
                const army = data.units.map(utid => unitTypes.get(utid));

                return (
                    <>
                        <b>{attacker.name}</b> attacked <b>{attacked ? attacked.name : "a neutral force"}</b> from <b>{attackingRegion.name}</b> to <b>
                        {attackedRegion.name}</b> with {joinReactNodes(army.map(ut => ut.name), ', ')}.
                    </>
                );

            case "march-resolved":
                let house = this.game.houses.get(data.house);
                const startingRegion = this.world.regions.get(data.startingRegion);
                const moves: [Region, UnitType[]][] = data.moves.map(([rid, utids]) => [this.world.regions.get(rid), utids.map(utid => unitTypes.get(utid))]);

                return (
                    <>
                        <b>{house.name}</b> marched from <b>{startingRegion.name}</b>:
                        <ul>
                            {moves.map(([region, unitTypes]) => (
                                <li key={region.id}>
                                    {joinReactNodes(unitTypes.map((ut, i) => <b key={i}>{ut.name}</b>), ", ")} to <b>{region.name}</b>
                                </li>
                            ))}
                        </ul>
                    </>
                );

            case "westeros-card-executed":
                const westerosCardType = westerosCardTypes.get(data.westerosCardType);

                return (
                    <>
                        <Row className="justify-content-center">
                            <Col xs="auto">
                                <WesterosCardComponent cardType={westerosCardType} size="small" tooltip={true}/>
                            </Col>
                        </Row>
                    </>
                );

            case "westeros-cards-drawn":
                const drawnWesterosCardTypes = data.westerosCardTypes.map(wctid => westerosCardTypes.get(wctid));

                return (
                    <>
                        <p>
                            Westeros cards were drawn:
                        </p>
                        <Row className="justify-content-around">
                            {drawnWesterosCardTypes.map((wct, i) => (
                                <Col xs="auto" key={i}>
                                    <WesterosCardComponent cardType={wct} size="small" tooltip={true} />
                                </Col>
                            ))}
                        </Row>
                        {data.addedWildlingStrength > 0 && (
                            <p>Wildling strength increased by {data.addedWildlingStrength}</p>
                        )}
                    </>
                );

            case "combat-result":
                const houseCombatDatas = data.stats.map(stat => {
                    const house = this.game.houses.get(stat.house);
                    return {
                        ...stat,
                        house,
                        region: this.world.regions.get(stat.region),
                        houseCard: stat.houseCard != null ? house.houseCards.get(stat.houseCard) : null,
                    };
                });
                const winner = this.game.houses.get(data.winner);

                return (
                    <>
                        <p>Combat result</p>
                        <CombatInfoComponent housesCombatData={houseCombatDatas}/>
                        <p><strong>{winner.name}</strong> won the fight!</p>
                    </>
                );
            case "wildling-card-revealed":
                console.log(this.game.wildlingDeck);
                const wildlingCard = this.game.wildlingDeck.find(wc => wc.id == data.wildlingCard) as WildlingCard;

                return (
                    <>
                        Wildling card revealed:
                        <Row className="justify-content-center">
                            <Col xs="auto">
                                <WildlingCardComponent cardType={wildlingCard.type} size="small" tooltip={true} placement="auto"/>
                            </Col>
                        </Row>
                    </>
                );
            case "wildling-bidding":
                const results: [number, House[]][] = data.results.map(([bid, hids]) => [bid, hids.map(hid => this.game.houses.get(hid))]);

                return (
                    <>
                        Wildling bidding results:
                        <table>
                            {results.map(([bid, houses]) => houses.map(h => (
                                <tr key={h.id}>
                                    <td>{h.name}</td>
                                    <td>{bid}</td>
                                </tr>
                            )))}
                        </table>
                        {data.nightsWatchVictory ? (
                            <>The <strong>Night's Watch</strong> won!</>
                        ) : (
                            <>The <strong>Wildling</strong> won!</>
                        )}
                    </>
                );

            case "lowest-bidder-chosen":
                const lowestBidder = this.game.houses.get(data.lowestBidder);

                return (
                    <>
                        <strong>{lowestBidder.name}</strong> was chosen as the lowest bidder.
                    </>
                );

            case "highest-bidder-chosen":
                const highestBidder = this.game.houses.get(data.highestBidder);

                return (
                    <>
                        <strong>{highestBidder.name}</strong> was chosen as the highest bidder.
                    </>
                );

            case "player-mustered":
                house = this.game.houses.get(data.house);
                    const musterings = _.flatMap(data.musterings.map(([_, musterements]: [string, {region: string, from: string | null, to: string}[]]) =>
                    musterements.map(({region, from, to}) => ({
                        region: this.game.world.regions.get(region),
                        from: from ? unitTypes.get(from) : null,
                        to: unitTypes.get(to)
                    }))
                ));

                return (
                    <>
                        <p>
                            <strong>{house.name}</strong> mustered:
                        </p>
                        <ul>
                            {musterings.map(({region, from, to}) => (
                                <li>
                                    {from ? (
                                        <>
                                            A <strong>{to.name}</strong> from a <strong>{from.name}</strong> in <strong>{region.name}</strong>
                                        </>
                                    ) : (
                                        <>A <strong>{to.name}</strong> in <strong>{region.name}</strong></>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                );

            case "winner-declared":
                return (
                    <>Game ended</>
                );

            case "raven-holder-wildling-card-put-bottom":
                house = this.game.houses.get(data.ravenHolder);

                return (
                    <p>
                        <strong>{house.name}</strong>, holder of the Raven token, chose to see the card at the top
                        of the wildling card deck and to move it at the bottom of the deck.
                    </p>
                );

            case "raven-holder-wildling-card-put-top":
                house = this.game.houses.get(data.ravenHolder);

                return (
                    <p>
                        <strong>{house.name}</strong>, holder of the Raven token, chose to see the card at the top
                        of the wildling card deck and to leave it at the top of the deck.
                    </p>
                );

            case "raid-done":
                const raider = this.game.houses.get(data.raider);
                const raiderRegion = this.world.regions.get(data.raiderRegion);
                const raidee = data.raidee ? this.game.houses.get(data.raidee) : null;
                const raidedRegion = data.raidedRegion ? this.world.regions.get(data.raidedRegion) : null;
                const orderRaided = data.orderRaided ? orders.get(data.orderRaided) : null;

                // Those 3 variables will always be all null or all non-null
                if (raidee && raidedRegion && orderRaided) {
                    return (
                        <p>
                            <strong>{raider.name}</strong> raided <strong>{raidee.name}</strong>'s <strong>{orderRaided.type.name}
                            </strong> in <strong>{raidedRegion.name}</strong> from <strong>{raiderRegion.name}</strong>
                        </p>
                    );
                } else {
                    return (
                        <p>
                            <strong>{raider.name}</strong> raided nothing from <strong>{raiderRegion.name}</strong>
                        </p>
                    );
                }

            case "a-throne-of-blades-choice":
                house = this.game.houses.get(data.house);

                return (
                    <p>
                        <strong>{house.name}</strong>, holder of the Iron Throne token, chose to
                        {data.choice == 0 ? (
                            <> trigger a Mustering.</>
                        ) : data.choice == 1 ? (
                            <> trigger a Supply.</>
                        ) : (
                            <> trigger nothing.</>
                        )}
                    </p>
                );

            case "dark-wings-dark-words-choice":
                house = this.game.houses.get(data.house);

                return (
                    <p>
                        <strong>{house.name}</strong>, holder of the Raven token, chose to
                        {data.choice == 0 ? (
                            <> trigger a Clash of Kings.</>
                        ) : data.choice == 1 ? (
                            <> trigger a Game of Thrones.</>
                        ) : (
                            <> trigger nothing.</>
                        )}
                    </p>
                );

            case "put-to-the-sword-choice":
                house = this.game.houses.get(data.house);

                return (
                    <p>
                        <strong>{house.name}</strong>, holder of the Valyrian Steel Blade token, chose to
                        {data.choice == 0 ? (
                            <> forbid <strong>March +1</strong> orders from being played during this Planning phase.</>
                        ) : data.choice == 1 ? (
                            <> forbid <strong>Defense</strong> orders from being played during this Planning phase.</>
                        ) : (
                            <> trigger nothing.</>
                        )}
                    </p>
                );

            case "winter-is-coming":
                const drawnCardType = westerosCardTypes.get(data.drawnCardType);

                return <>
                    <strong>Winter is coming:</strong> the Westeros deck was shuffled and the new Westeros card drawn
                    is <strong>{drawnCardType.name}</strong>.
                </>;

            case "westeros-phase-began":
                return <Row className="justify-content-center">
                    <Col xs="auto">
                        <h6><strong>Westeros Phase</strong></h6>
                    </Col>
                </Row>;

            case "planning-phase-began":
                return <Row className="justify-content-center">
                    <Col xs="auto">
                        <h6><strong>Planning Phase</strong></h6>
                    </Col>
                </Row>;

            case "action-phase-began":
                return <Row className="justify-content-center">
                    <Col xs="auto">
                        <h6><strong>Action Phase</strong></h6>
                    </Col>
                </Row>;

            case "combat-valyrian-sword-used":
                house = this.game.houses.get(data.house);

                return <><strong>{house.name}</strong> used the <strong>Valyrian Sword</strong>.</>;

            case "combat-house-card-chosen":
                let houseCards = data.houseCards.map(([hid, hcid]) => {
                    const house = this.game.houses.get(hid);
                    return [house, house.houseCards.get(hcid)];
                });

                return <>
                    <p>House cards were chosen:</p>
                    <ul>
                        {houseCards.map(([h, hc]) => (
                            <li key={h.id}><strong>{h.name}</strong> chose <strong>{hc.name}</strong></li>
                        ))}
                    </ul>
                </>;

            case "clash-of-kings-final-ordering":
                const finalOrder = data.finalOrder.map(hid => this.game.houses.get(hid));

                return <>
                    <p>
                        Final order for {this.game.getNameInfluenceTrack(data.trackerI)}: {
                        joinReactNodes(finalOrder.map(h => <strong key={h.id}>{h.name}</strong>), ", ")}
                    </p>
                </>;

            case "clash-of-kings-bidding-done":
                const bids = _.flatMap(data.results.map(([bid, hids]) => hids.map(hid => [bid, this.game.houses.get(hid)] as [number, House])));

                return <>
                    <p>
                        Houses bid for the {this.game.getNameInfluenceTrack(data.trackerI)}:
                    </p>
                    <ul>
                        {bids.map(([bid, house]) => (
                            <li key={house.id}><strong>{house.name}</strong> bid <strong>{bid}</strong></li>
                        ))}
                    </ul>
                </>;

            case "wildling-strength-trigger-wildling-attack":
                return <>
                    <strong>Wildling strength</strong> reached <strong>{data.wildlingStrength}</strong>, triggering a <strong>Wildling attack</strong>
                </>;
            case "march-order-removed":
                house = this.game.houses.get(data.house);
                let region = this.game.world.regions.get(data.region);

                return <>
                    <p>
                        <strong>{house.name}</strong> removed his march order in <strong>{region.name}</strong>.
                    </p>
                </>;

            case "starred-consolidate-power-for-power-tokens":
                house = this.game.houses.get(data.house);
                region = this.world.regions.get(data.region);
                const countPowerToken = data.powerTokenCount;

                return <>
                    <strong>{house.name}</strong> resolved a Starred Consolidate Power Order token
                    in <strong>{region.name}</strong> to gain <strong>{countPowerToken}</strong> Power token{countPowerToken > 0 && "s"}.
                </>;

            case "armies-reconciled":
                house = this.game.houses.get(data.house);
                const armies = data.armies.map(([rid, utids]) => [this.world.regions.get(rid), utids.map(utid => unitTypes.get(utid))] as [Region, UnitType[]]);

                return <>
                    <p>
                        <strong>{house.name}</strong> reconciled their armies by removing:
                    </p>
                    <ul>
                        {armies.map(([region, unitTypes]) => (
                            <li key={region.id}>{region.name}: {unitTypes.map(ut => ut.name).join(", ")}</li>
                        ))}
                    </ul>
                </>;

            case "tyrion-lannister-choice-made":
                house = this.game.houses.get(data.house);
                let affectedHouse = this.game.houses.get(data.affectedHouse);
                const chooseToReplace = data.chooseToReplace;

                return <>
                    <strong>Tyrion Lannister</strong>: <strong>{house.name}</strong> {chooseToReplace && "not"} to force
                    <strong>{affectedHouse.name}</strong> to choose a new House card.
                </>;

            case "tyrion-lannister-house-card-replaced":
                affectedHouse = this.game.houses.get(data.affectedHouse);
                const newHouseCard = data.newHouseCard ? affectedHouse.houseCards.get(data.newHouseCard) : null;

                return newHouseCard ? (
                    <><strong>{affectedHouse.name}</strong> chose <strong>{newHouseCard.name}.</strong></>
                ) : (
                    <><strong>{affectedHouse.name}</strong> had no other available House card</>
                );

            case "arianne-martell-prevent-movement":
                const enemyHouse = this.game.houses.get(data.enemyHouse);

                return <>
                    <strong>Arianne Martell</strong>: <strong>{enemyHouse.name}</strong> cannot move their attacking
                    army to the embattled area.
                </>;

            case "roose-bolton-house-cards-returned":
                house = this.game.houses.get(data.house);
                const returnedHouseCards = data.houseCards.map(hcid => house.houseCards.get(hcid));

                return <>
                    <strong>Roose Bolton</strong>: <strong>{house.name}</strong> took back all discarded House
                    cards ({returnedHouseCards.map(hc => hc).join(", ")}).
                </>;

            case "loras-tyrell-attack-order-moved":
                const order = orders.get(data.order);
                const embattledRegion = this.world.regions.get(data.region);

                return <>
                    <strong>Loras Tyrell</strong>: The <strong>{order.type.name}</strong> order was moved
                    to <strong>{embattledRegion.name}</strong>.
                </>;

            case "queen-of-thorns-no-order-available":
                house = this.game.houses.get(data.house);
                affectedHouse = this.game.houses.get(data.affectedHouse);

                return <>
                    <strong>Queen of Thorns</strong>: <strong>{affectedHouse.name}</strong> had no adjacent order tokens.
                </>;

            case "queen-of-thorns-order-removed":
                house = this.game.houses.get(data.house);
                affectedHouse = this.game.houses.get(data.affectedHouse);
                region = this.world.regions.get(data.region);
                const removedOrder = orders.get(data.orderRemoved);

                return <>
                    <strong>Queen of Thorns</strong>: <strong>{house.name}</strong> removed
                    a <strong>{removedOrder.type.name}</strong> of <strong>{affectedHouse.name}</strong> in <strong>{region.name}</strong>.
                </>;

            case "tywin-lannister-power-tokens-gained":
                house = this.game.houses.get(data.house);
                const powerTokensGained = data.powerTokensGained;

                return <>
                    <strong>Tywin Lannister</strong>: <strong>{house.name}</strong> gained {powerTokensGained} Power
                    tokens.
                </>;
        }
    }
}

export default autoscroll(GameLogListComponent);
