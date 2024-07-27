import { trim } from "lodash";

export enum KanbotCommands {
    ADD,
    CLEAR,
    COMPLETE,
    HELP,
    REMOVE,
    START,
    ASSIGN,
    DEPEND,
}

function getKanbotCommand(command: string): KanbotCommands {
    switch (command) {
        case 'add':
            return KanbotCommands.ADD;
        case 'clear':
            return KanbotCommands.CLEAR;
        case 'complete':
            return KanbotCommands.COMPLETE;
        case 'remove':
            return KanbotCommands.REMOVE;
        case 'start':
            return KanbotCommands.START;
        case 'assign':
            return KanbotCommands.ASSIGN;
        case 'depend':
            return KanbotCommands.DEPEND;
        case 'help':
        default:
            return KanbotCommands.HELP;
    }
}

export interface KanbotRequest {
    command: KanbotCommands;
    args: string[];
}

export class KanbotRequest implements KanbotRequest {

    constructor(command: KanbotCommands, args: string[]) {
        this.command = command;
        this.args = args;
    }

    public static parseString(input: string[]): KanbotRequest {
        // split on first space - won't work if we allow commands to have multiple arguments
        //const spaceIndex: number = input.indexOf(' ');
        //const command: KanbotCommands = getKanbotCommand(input.substring(0, spaceIndex));
        //const taskName: string = `${trim(input.substring(spaceIndex + 1, input.length), '"')}`;

        // expects command structure "$signal command arg1 arg2 etc"
        // see help section for individual command syntax
        // first element contains signal, so we ingore it when parsing

        // command should be second element
        const command: KanbotCommands = getKanbotCommand(input[1]);

        // all further elements are arguments
        const args: string[] = input.slice(1, input.length); // Will be an empty array if there are no further arguments

        return new KanbotRequest(command, args);
    }
}