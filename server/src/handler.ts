import * as fs from "fs";
import * as glob from "glob";
import * as LServer from "vscode-languageserver";
import * as abaplint from "@abaplint/core";
import { URI } from "vscode-uri";
import { Setup } from "./setup";
import {WorkDoneProgress} from "vscode-languageserver/lib/progress";

export interface IFolder {
    root: string;
    glob: string;
}

class Progress implements abaplint.IProgress {
    private readonly renderThrottle = 2000;
    private readonly progress: WorkDoneProgress;
    private total: number;
    private lastRender: number;
    private current: number;

    public constructor(progress: WorkDoneProgress) {
        this.progress = progress;
    }

    public set(total: number, _text: string): void {
        this.total = total;
        this.current = 0;
        this.lastRender = 0;
    }

    public async tick(text: string) {
        this.current++;

        // dont run the logic too often
        if (this.current % 10 !== 0) {
            return;
        }

        const now = Date.now();
        const delta = now - this.lastRender;
        // only update progress every this.throttle milliseconds
        if (delta > this.renderThrottle) {
            const percent = Math.floor((this.current / this.total) * 100);
            this.progress.report(percent, text);
            // hack
            await new Promise((resolve) => { setTimeout(resolve, 0); });
            this.lastRender = Date.now();
        }
    }
}

export class Handler {
    private folders: IFolder[] = [];
    private reg: abaplint.Registry;
    private connection: LServer.Connection;
    private setup: Setup;

    constructor(connection: LServer.Connection, params: LServer.InitializeParams) {
        this.reg = new abaplint.Registry();
        this.connection = connection;

        this.setup = new Setup(connection);
        this.folders = this.setup.determineFolders(params.workspaceFolders);
        this.readAndSetConfig();
    }

    private readAndSetConfig() {
        this.reg.setConfig(this.setup.readConfig(this.folders));
    }

    public validateDocument(textDocument: LServer.TextDocument) {
        this.connection.console.log("validateDocument");
        if (textDocument.uri.match(/^git:/)) {
            return; // ignore git things, triggered by revert code
        }

        const file = new abaplint.MemoryFile(textDocument.uri, textDocument.getText());
        try {
            this.reg.updateFile(file);
        } catch  {
            this.reg.addFile(file);
        }

        const diagnostics = new abaplint.LanguageServer(this.reg).diagnostics(textDocument);
        this.connection.console.log(diagnostics.toString());
        this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    }

    public async loadAndParseAll(progress: WorkDoneProgress) {
        progress.report(0, "Reading files");
        for (const folder of this.folders) {
            const filenames = glob.sync(folder.root + folder.glob, { nosort: true, nodir: true });
            for (const filename of filenames) {
                const raw = await fs.promises.readFile(filename, "utf-8");
                const uri = URI.file(filename).toString();
                this.reg.addFile(new abaplint.MemoryFile(uri, raw));
            }
        }

        progress.report(0, "Parsing files");
        await this.reg.parseAsync(new Progress(progress));
    }

    public updateTooltip() {
        const tooltip = "ABAP version: " + this.reg.getConfig().getVersion() + "\n" +
          "abaplint: " + abaplint.Registry.abaplintVersion() + "\n" +
          "Objects: " + this.reg.getObjects().length;
        this.connection.sendNotification("abaplint/status", {text: "Ready", tooltip});
      }

}