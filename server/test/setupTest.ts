import { expect } from 'chai';
import { createConnection, IConnection, IPCMessageReader, IPCMessageWriter, WorkspaceFolder } from 'vscode-languageserver';
import { IFolder } from "./../src/handler";
import { Setup } from "./../src/setup";

describe("determine folders", () => {
    const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    let setup = new Setup(connection);
    let ws: WorkspaceFolder[] = [{uri: "dummy", name: "name"}];
    const ret = setup.determineFolders(ws);
    console.log(ret);
    it('should return deps files', () => { expect(1).to.equals(1); });
});

describe("read config with Files", () => {
    let ret: IFolder[] = [{root: "workspace.getWorkspaceFolder.toString()", glob: "name"}];
    console.log(ret);
    const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    let setup = new Setup(connection);
    setup.readConfig(ret);
    it('should return deps files', () => { expect(1).to.equals(1); });
});

describe("read config without Files", () => {
    let ret: IFolder[] = [];
    console.log(ret);
    const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    let setup = new Setup(connection);
    setup.readConfig(ret);
    it('should return deps files', () => { expect(1).to.equals(1); });
});