import * as LServer from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Handler } from "./handler";

const connection = LServer.createConnection(LServer.ProposedFeatures.all);
let handler: Handler;

// create a simple text document manager. The text document manager
// supports full document sync only
const documents = new LServer.TextDocuments(TextDocument);
let hasConfigurationCapability: boolean | undefined = false;
let hasWorkspaceFolderCapability: boolean | undefined = false;

connection.onInitialize(async (params: LServer.InitializeParams, _cancel, progress) => {

  const capabilities = params.capabilities;
  console.log(capabilities);

  // does the client support the `workspace/configuration` request?
  // if not, we will fall back using global settings
  hasConfigurationCapability =
    capabilities.workspace && !!capabilities.workspace.configuration;
  hasWorkspaceFolderCapability =
    capabilities.workspace && !!capabilities.workspace.workspaceFolders;

  progress.begin("", 0, "Initialize", true);
  handler = new Handler(connection, params);
  await handler.loadAndParseAll(progress);
  progress.done();


  const result: LServer.InitializeResult = {capabilities: {
    /*
    signatureHelpProvider: [],
    completionProvider
    referencesProvider
    codeLensProvider
    */
    textDocumentSync: LServer.TextDocumentSyncKind.Full,
    documentFormattingProvider: true,
    definitionProvider: true,
    codeActionProvider: true,
    documentHighlightProvider: true,
    documentSymbolProvider: true,
    implementationProvider: true,
    renameProvider: {prepareProvider: true},
    hoverProvider: true,
  }};

  return result;
});

connection.onInitialized(() => {

  handler.updateTooltip();

  if (hasConfigurationCapability) {
    connection.client.register(
      LServer.DidChangeConfigurationNotification.type,
      undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      // todo, handle event
      connection.console.log("Workspace folder change event received.");
    });
  }
});

documents.onDidChangeContent((change) => {
  handler.validateDocument(change.document);
});

documents.listen(connection);
connection.listen();