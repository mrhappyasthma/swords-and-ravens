import HouseCard, {SerializedHouseCard} from "./house-card/HouseCard";
import {observable} from "mobx";
import BetterMap from "../../../utils/BetterMap";
import UnitType from "./UnitType";
import unitTypes from "./unitTypes";
import Game from "./Game";

const MAX_POWER_TOKENS = 20;

export default class House {
    id: string;
    name: string;
    color: string;
    houseCards: BetterMap<string, HouseCard>;
    unitLimits: BetterMap<UnitType, number>;
    @observable powerTokens: number;
    @observable supplyLevel: number;

    /**
     * Is null for houses that are directly controlled by a player and
     * vassal houses when they are in the processes of being picked.
     */
    @observable suzerainHouse: House | null;

    constructor(id: string, name: string, color: string, houseCards: BetterMap<string, HouseCard>, unitLimits: BetterMap<UnitType, number>, powerTokens: number, supplyLevel: number, suzerainHouse: House | null) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.houseCards = houseCards;
        this.unitLimits = unitLimits;
        this.powerTokens = powerTokens;
        this.supplyLevel = supplyLevel;
        this.suzerainHouse = suzerainHouse;
    }

    changePowerTokens(delta: number): number {
        const originalValue = this.powerTokens;

        this.powerTokens += delta;
        this.powerTokens = Math.max(0, Math.min(this.powerTokens, MAX_POWER_TOKENS));

        return this.powerTokens - originalValue;
    }

    serializeToClient(): SerializedHouse {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            houseCards: this.houseCards.entries.map(([houseCardId, houseCard]) => [houseCardId, houseCard.serializeToClient()]),
            unitLimits: this.unitLimits.map((unitType, limit) => [unitType.id, limit]),
            powerTokens: this.powerTokens,
            supplyLevel: this.supplyLevel,
            suzerainHouse: this.suzerainHouse ? this.suzerainHouse.id : null
        };
    }

    static deserializeFromServer(game: Game, data: SerializedHouse): House {
        return new House(
            data.id,
            data.name,
            data.color,
            new BetterMap<string, HouseCard>(
                data.houseCards.map(([string, data]) => [string, HouseCard.deserializeFromServer(data)]),
            ),
            new BetterMap<UnitType, number>(
                data.unitLimits.map(([utid, limit]) => [unitTypes.get(utid), limit])
            ),
            data.powerTokens,
            data.supplyLevel,
            data.suzerainHouse ? game.houses.get(data.suzerainHouse) : null
        );
    }
}

export interface SerializedHouse {
    id: string;
    name: string;
    color: string;
    houseCards: [string, SerializedHouseCard][];
    unitLimits: [string, number][];
    powerTokens: number;
    supplyLevel: number;
    suzerainHouse: string | null;
}
