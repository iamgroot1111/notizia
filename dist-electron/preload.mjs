"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // Clients
  listClients: () => electron.ipcRenderer.invoke("clients:list"),
  addClient: (name, note) => electron.ipcRenderer.invoke("clients:add", { name, note }),
  updateClient: (id, name, note) => electron.ipcRenderer.invoke("clients:update", { id, name, note }),
  deleteClient: (id) => electron.ipcRenderer.invoke("clients:delete", id),
  // Cases
  listCases: (clientId) => electron.ipcRenderer.invoke("cases:list", clientId),
  addCase: (c) => electron.ipcRenderer.invoke("cases:add", c),
  updateCaseOutcome: (payload) => electron.ipcRenderer.invoke("cases:updateOutcome", payload),
  // Sessions
  listSessions: (caseId) => electron.ipcRenderer.invoke("sessions:list", caseId),
  addSession: (s) => electron.ipcRenderer.invoke("sessions:add", s),
  deleteSession: (id) => electron.ipcRenderer.invoke("sessions:delete", id)
});
