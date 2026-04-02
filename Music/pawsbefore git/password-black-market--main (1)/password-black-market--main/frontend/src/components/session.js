export const SESSION_KEYS = {
  token: "token",
  team: "team"
};

export const setSession = ({ token, team }) => {
  localStorage.setItem(SESSION_KEYS.token, token);
  localStorage.setItem(SESSION_KEYS.team, JSON.stringify(team));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEYS.token);
  localStorage.removeItem(SESSION_KEYS.team);
};

export const getSession = () => {
  const token = localStorage.getItem(SESSION_KEYS.token);
  const teamRaw = localStorage.getItem(SESSION_KEYS.team);

  return {
    token,
    team: teamRaw ? JSON.parse(teamRaw) : null
  };
};

export const updateTeamSession = (team) => {
  localStorage.setItem(SESSION_KEYS.team, JSON.stringify(team));
};
