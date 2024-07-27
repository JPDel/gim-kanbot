import Discord, { EmbedBuilder } from 'discord.js';
import { KanbotCommands, KanbotRequest } from '../application/constants/kanbot-commands';
import { KanbanBoard } from '../application/kanban-board';
import { KanbotConfiguration } from '../application/kanbot-configuration';
import { Task } from '../application/models/task';
import { Kanban } from '../application/namespaces/kanban-board';
import * as help from '../util/commands.json';

export class KanbotClient {

    private signal: string;
    private botName: string;
    private token: string;

    constructor(kanbotConfiguration: KanbotConfiguration,
        private discordClient: Discord.Client,
        private board: KanbanBoard = new KanbanBoard()) {
        
        this.signal = kanbotConfiguration.signal;
        this.botName = kanbotConfiguration.botName;
        this.token = kanbotConfiguration.token;
    }

    /**
     * handleLogin
     */
    public handleLogin(): void {
        this.discordClient.login(this.token).then(value => console.log(value));
    }

    /**
     * handleReady
     */
    public handleReady(): void {
        this.discordClient.on('ready', () => console.log(`${this.botName} is online!`));
    }

    public handleMessage(): void {
        this.discordClient.on('messageCreate', (message: Discord.Message) => this.handleRequest(message));
    }

    /**
     * handleRequest
     * @param message DiscordMessage
     */
    public handleRequest(message: Discord.Message): void {
        const channel = message.channel as Discord.BaseGuildTextChannel;
        const embed = new EmbedBuilder()
            .setColor(344703);

        if (message.author.bot) return;

        // Parse command, and check.
        const inputs: string[] = message.content.split(' ');
        if (inputs[0] !== this.signal) return;

        // display board
        if (inputs.length === 1) {
            this.displayBoard(message, channel);
            return;
        }

        console.warn(inputs[1]);

        const request: KanbotRequest = KanbotRequest.parseString(inputs);
        switch (request.command) {
            case KanbotCommands.ADD:
                this.addToBacklog(message, channel, request.args);
                break;
            case KanbotCommands.HELP:
                this.helpList(message, channel);
                break;
            case KanbotCommands.REMOVE:
                this.removeItem(message, channel, request.args);
                break;
            case KanbotCommands.START:
                this.startItem(message, channel, request.args);
                break;
            case KanbotCommands.COMPLETE:
                this.completeItem(message, channel, request.args);
                break;
            case KanbotCommands.CLEAR:
                this.board.clearBoard();
                embed .setDescription('Board cleared by: ${message.author.username}');
                channel.send({ embeds: [embed]});
                break;
            case KanbotCommands.ASSIGN:
                this.changeAssignees(message, channel, request.args);
                break;
            case KanbotCommands.DEPEND:
                this.changeDependencies(message, channel, request.args);
                break;
            default:
                embed.setDescription('Invalid request: ${request.command} ${request.args}')
                channel.send({ embeds: [embed]});
                break;
        }
    }

    private displayBoard(message: Discord.Message, channel: Discord.BaseGuildTextChannel) {
        const embed = new Discord.EmbedBuilder()
            .setColor(3447003)
            .setDescription('${this.botName}')
            .addFields(
                {name: 'Project Backlog ', value: `\`\`\`${this.displayColumn(this.board.backlog.getTasks())}\`\`\``},
                {name: 'In Progress ', value: `\`\`\`${this.displayColumn(this.board.inProgress.getTasks())}\`\`\``},
                {name: 'Completed Tasks', value: `\`\`\`${this.displayColumn(this.board.complete.getTasks())}\`\`\``}
            );
        channel.send({ embeds: [embed]});
    }

    private displayColumn(from: Task[]) {
        return from.map(task => task.toString()).join('\n');
    }

    private addToBacklog(message: Discord.Message, channel: Discord.BaseGuildTextChannel, args: string[]) {
        const author: string = message.author.username;
        const embed = new EmbedBuilder()
            .setColor(344703);
        if (this.board.containsTask(args[0])) {
            embed.setDescription("Not adding task ${args[0]} because it already exists in the kanban board.");
            channel.send({ embeds: [embed]});
            return;
        }
        embed.setDescription("${args[0]} has been added to the Backlog by ${author}");
        channel.send({ embeds: [embed]});
        this.board.addToBacklog(new Task(args[0], author));
    }

    private async changeAssignees(message: Discord.Message, channel: Discord.BaseGuildTextChannel, args: string[]) { 
        const task: Task = await this.board.findMatch(args[0]);
        const embed = new Discord.EmbedBuilder()
            .setColor(3447003);
        if (args[1] == 'add'){
            this.board.addAssignee(task, args[2]);
        }
        else if (args[1] == 'remove'){
            this.board.removeAssignee(task, args[2]);
        }
        else{
            embed.setDescription('Second argument not recognized')
            channel.send({ embeds: [embed]});
            return;
        }
    }

    private async changeDependencies(message: Discord.Message, channel: Discord.BaseGuildTextChannel, args: string[]) {
        const parent: Task = await this.board.findMatch(args[2]);
        const child: Task = await this.board.findMatch(args[1]);
        const embed = new Discord.EmbedBuilder()
            .setColor(3447003);
        if (args[0] == 'add'){
            this.board.addDependencies(parent, child);
        }
        else if (args[0] == 'remove'){
            this.board.removeDependencies(parent, child);
        }
        else{
            embed.setDescription('First argument not recognized')
            channel.send({ embeds: [embed]});
            return;
        }
    }

    private helpList(message: Discord.Message, channel: Discord.BaseGuildTextChannel,) {
        const embed = new Discord.EmbedBuilder()
            .setColor('#0074E7')
            .setTitle('List of Board Commands')
            .setDescription('Tasks can be referenced either by description or ID')
            .addFields(
                { name: '${help.view.command}', value: '${help.view.desc}', inline: true },
                { name: '${help.add.command}', value: '${help.add.desc}', inline: true },
                { name: '${help.remove.command}', value: '${help.add.desc}'},
                { name: '${help.clearTask.command}', value: '${help.clearTask.desc}', inline: true },
                { name: '${help.startTask.command}', value: '${help.startTask.desc}', inline: true },
                { name: '${help.completeTask.command}', value: '${help.completeTask.desc}'},
                { name: '${help.changeAssignees.command}', value: '${help.changeAssignees.desc}', inline: true },
                { name: '${help.changeDependencies.command}', value: '${help.changeDependencies.desc}', inline: true },
            );
        console.log(message);
        channel.send({ embeds: [embed]});
        return;
    }

    private async removeItem(message: Discord.Message, channel: Discord.BaseGuildTextChannel, item: string[]): Promise<Discord.Message | Discord.Message[]> {
        try {
            const match: Task = await this.board.findMatch(item[0]);
            this.board.remove(match);
            /*return message.channel.send({
                embed: {
                    color: 3447003,
                    description: `Removed ${item} by ${message.author.username}`
                }
            });*/
            return channel.send('No matching item found, nothing removed.');
        } catch (error) {
            console.log(error);
            /*return message.channel.send({
                embed: {
                    color: 3447003,
                    description: 'No matching item found, nothing removed.'
                }
            });*/
            return channel.send('No matching item found, nothing removed.');
        }
    }

    private startItem(message: Discord.Message, channel: Discord.BaseGuildTextChannel, item: string[]) {
        this.forward(item[0], this.board.backlog, this.board.inProgress, message, channel);
    }

    private completeItem(message: Discord.Message, channel: Discord.BaseGuildTextChannel, item: string[]) {
        this.forward(item[0], this.board.inProgress, this.board.complete, message, channel);
    }

    private forward(item: string, from: Kanban.Board.Column, to: Kanban.Board.Column, message: Discord.Message, channel: Discord.BaseGuildTextChannel) {
        var task: Task | undefined = from.findMatch({ name: item } as Task); // Attempts to find the task by name



        if (task instanceof Task) {
            from.remove(task);
            to.add(task);
            /*channel.send({
                embed: {
                    color: 3447003,
                    description: `${item} moved from "${from.getName()}" to "${to.getName()}" by: ${message.author.username}`
                }
            });*/
            channel.send('${item} moved from "${from.getName()}" to "${to.getName()}" by: ${message.author.username}');
        }
    }
}