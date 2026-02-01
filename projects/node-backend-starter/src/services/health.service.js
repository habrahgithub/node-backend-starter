export const getHealth = () => {
  return {
    ok: true,
    service: "node-backend-starter",
    time: new Date().toISOString()
  };
};
