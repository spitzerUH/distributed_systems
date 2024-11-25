export const PC_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
  ]
};
