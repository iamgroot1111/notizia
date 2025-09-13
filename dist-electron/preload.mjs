"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  listClients: () => electron.ipcRenderer.invoke("clients:list"),
  addClient: (name, note) => electron.ipcRenderer.invoke("clients:add", { name, note }),
  updateClient: (id, name, note) => electron.ipcRenderer.invoke("clients:update", { id, name, note }),
  deleteClient: (id) => electron.ipcRenderer.invoke("clients:delete", id)
});
