import { getJwtFromUser } from '../../services/utils';

import config from "../../config.json";
const useLocal = config.USE_LOCAL_API;
const localUrlBase = config.LOCAL_API_BASE; 
const remoteUrlBase = config.REST_API_BASE;

export function getPlans(user) {
  return useLocal ? getPlansLocal() : getPlansRemote(user);
}

export function getPlan(user, id) { 
  return useLocal ? getPlanLocal(id) : getPlanRemote(user, id);
}

// LOCAL VERSIONS (w/ `npm run dev-backend`, no auth)

function getPlansLocal() { 
  console.log("***log", localUrlBase)
  return fetch(`${localUrlBase}/plans`).then((res) => res.json());
}

function getPlanLocal(id) { 
  return fetch(`${localUrlBase}/plans/${id}`).then((res)=>res.json());
}

// REMOTE VERSIONS

function getPlansRemote(user) { 
  console.log(`Plans user: ${user}`)
  const jwt = getJwtFromUser(user);
  console.log(`Plans jwt: ${jwt}`)
  return fetch(`${remoteUrlBase}/admin/plans`, { 
    method: 'GET', 
    headers: { 
      Accept: 'application/json', 
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    }
  }).then(res => res.json());
}

function getPlanRemote(user, id) { 
  const jwt = getJwtFromUser(user); 
  return fetch(`${remoteUrlBase}/admin/plans/${id}`, { 
    method: 'GET', 
    headers: { 
      Accept: 'application/json', 
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + jwt
    }
  }).then((res)=>res.json());
}
