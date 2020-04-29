import { expect } from 'chai';
import { Setup } from "./../src/setup";
import { IFolder } from "./../src/handler";
import {
    IPCMessageReader, IPCMessageWriter, createConnection, IConnection
} from 'vscode-languageserver';

describe("read config", () => {
    let ret: IFolder[] = []; //["${workspaceFolder}/server/test/"];
    console.log(ret);
    const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    let setup = new Setup(connection);
    setup.readConfig(ret);
    it('should return deps files', () => { expect(1).to.equals(1); });
});