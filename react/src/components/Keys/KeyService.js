import { getJwtFromUser } from '../../services/utils';

import config from "../../config.json";
const useLocal = config.USE_LOCAL_API;
const localUrlBase = config.LOCAL_API_BASE; 
const remoteUrlBase = config.REST_API_BASE;


export function getKeys(user) {
  return useLocal ? getKeysLocal() : getKeysRemote(user);
}

export function createKey(user, key) {
  return useLocal ? createKeyLocal(key) : createKeyRemote(user, key);
}

export function getKey(user, id) {
  return useLocal ? getKeyLocal(id) : getKeyRemote(user, id);
}

export function updateKey(user, key) {
  return useLocal ? updateKeyLocal(key) : updateKeyRemote(user, key);
}

export function deleteKey(user, id) {
  return useLocal ? deleteKeyLocal(id) : deleteKeyRemote(user, id);
}


// LOCAL VERSIONS(w/ `npm run dev-backend`, no auth)


function getKeysLocal() {
  return fetch(`${localUrlBase}/keys`).then((data) => data.json());
}

function createKeyLocal(key) {
  return fetch(`${localUrlBase}/keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(key),
  }).then((res) => res.json());
}


function getKeyLocal(id) {
  return fetch(`${localUrlBase}/keys/${id}`).then((res) => res.json());
}

function updateKeyLocal(key) {
  return fetch(`${localUrlBase}/keys/${key.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(key),
  }).then((res) => res.json());
}

function deleteKeyLocal(id) {
  return fetch(`${localUrlBase}/keys/${id}`, { method: "DELETE" });
}


// REMOTE VERSIONS

function getKeysRemote(user) {
  const jwt = getJwtFromUser(user);
  return fetch(`${remoteUrlBase}/admin/keys`, { 
      method: 'GET', 
      headers: { 
        Accept: 'application/json', 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + jwt
      }
  }).then((data) => data.json());
}

function createKeyRemote(user, key) {
  const jwt = getJwtFromUser(user);
  return fetch(`${remoteUrlBase}/admin/keys`, {
    method: "POST",
    headers: {
      Accept: 'application/json', 
      "Content-Type": "application/json",
      Authorization: 'Bearer ' + jwt
    },
    body: JSON.stringify(key),
  }).then((res) => res.json());
}

function getKeyRemote(user, id) {
  const jwt = getJwtFromUser(user);
  return fetch(`${remoteUrlBase}/admin/keys/${id}`, { 
    method: 'GET', 
    headers: { 
      Accept: 'application/json', 
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    }
  }).then((res) => res.json());
}

function updateKeyRemote(user, key) {
  const jwt = getJwtFromUser(user);
  const id = key.id;
  return fetch(`${remoteUrlBase}/admin/keys/${id}`, {
    method: "PUT",
    headers: { 
      Accept: 'application/json', 
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    },
    body: JSON.stringify(key),
  }).then((res) => res.json());
}

function deleteKeyRemote(user, id) {
  const jwt = getJwtFromUser(user);
  return fetch(`${remoteUrlBase}/admin/keys/${id}`, { 
    method: "DELETE",
    headers: { 
      Accept: 'application/json', 
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    }
  }).then((res) => res.json());
}
