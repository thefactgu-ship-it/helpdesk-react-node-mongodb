const ROLE_RANK = {
  User: 10,
  Agent: 20,
  Manager: 30,
  HotelAdmin: 40,
  RegionalManager: 45,
  Admin: 50,
  GroupAdmin: 60,
};

function getRoleRank(role) {
  return ROLE_RANK[role] || 0;
}

function canManageRole(actorRole, targetRole) {
  return getRoleRank(actorRole) >= getRoleRank(targetRole);
}

module.exports = {
  ROLE_RANK,
  canManageRole,
  getRoleRank,
};
