import { isEqual, isMatch } from "lodash";

interface ITask {
    readonly name: string;
    readonly creator?: string;
    readonly taskId?: number;

    matches: (other: Task) => boolean;
    toString: () => string;
}

export enum Status {
    BACKLOG = 'backlog',
    IN_PROGRESS = 'in progress',
    COMPLETE = 'complete'
}

export class Task implements ITask {

    private _status?: Status;
    private _assignees: string[]; // Users assigned to a task. Can have more than one assignee
    private _dependencies: Task[]; // Dependencies are child tasks that need to be completed before their parent task(s) can be completed
    private _isPrimitive: boolean; // A primitive task is a task with no dependencies. Logic is built in to dependency setters.

    constructor(readonly name: string, readonly creator?: string, status?: Status, 
                readonly taskId?: number, assignees: string[] = [], dependencies: Task[] = []) {

        this._status = status;
        this._assignees = assignees;
        this._dependencies = dependencies;

        if (this._dependencies.length == 0) {
            this._isPrimitive = true;
        }
        else {
            this._isPrimitive = false;
        }
        
    }

    set status(newStatus: Status) {
        this._status = newStatus;
    }

    static getTaskFromProperties(taskIdentifier: Task | string): Task {
        if (taskIdentifier instanceof Task) {
            return taskIdentifier;
        }
        return new Task(taskIdentifier);
    }

    addDependency(dependency: Task): void {
        this._dependencies.push(dependency);
    }

    removeDependency(dependency: Task): void {
        this._dependencies = this._dependencies.filter(task => task.matches(dependency));
    }

    get dependencies(): Task[] {
        return this._dependencies;
    }

    addAssignee(assignee: string): void {
        this._assignees.push(assignee);
    }

    removeAssignee(assigneeName: string): void {
        this._assignees = this._assignees.filter(assignee => assignee != assigneeName);
    }

    get assignees(): string[] {
        return this._assignees;
    }

    set isPrimitive(value: boolean){
        this._isPrimitive = value;
    }

    get isPrimitive(){
        return this._isPrimitive;
    }

    /**
     * Compare by name for now - in the future, enforce by id
     */
    matches(other: Task): boolean {
        return this.name === other.name;
    }

    equals(other: Task): boolean {
        return isEqual(this, other);
    }

    toString(): string {
        return `[id: ${this.taskId}, name: "${this.name}", assignees: ${this.assignees.join(", ")}]`;
    }

    /*toString(): string {
        return `[id: ${this.taskId}, name: "${this.name}", assignee: ${this.assignees}] created by ${this.creator}`;
    }*/
}