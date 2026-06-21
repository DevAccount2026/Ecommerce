function getCustomerTier(totalSpent) {
  const spent = Number(totalSpent || 0);

  if (spent >= 50000) return "Gold";
  if (spent >= 10000) return "Silver";
  if (spent >= 1000) return "Bronze";

  return "New";
}

function getNextTierInfo(totalSpent) {
  const spent = Number(totalSpent || 0);

  if (spent < 1000) {
    return {
      nextTier: "Bronze",
      remaining: 1000 - spent
    };
  }

  if (spent < 10000) {
    return {
      nextTier: "Silver",
      remaining: 10000 - spent
    };
  }

  if (spent < 50000) {
    return {
      nextTier: "Gold",
      remaining: 50000 - spent
    };
  }

  return {
    nextTier: "Max Tier",
    remaining: 0
  };
}

function getCustomerPoints(totalSpent) {
  return Number(totalSpent || 0);
}