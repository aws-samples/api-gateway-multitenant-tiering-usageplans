// utility function to simulate network delay
export function delay(ms) { 
  return new Promise( resolve => setTimeout(resolve, ms));
}

export function getJwtFromUser(user) {
  console.log(`user = ${user}`);
  const token = user?.signInUserSession.idToken.jwtToken;
  console.log(`token = ${token}`);
  return token;
}