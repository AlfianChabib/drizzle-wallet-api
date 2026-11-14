export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash);
};

export const hashPin = async (pin: string): Promise<string> => {
  return await Bun.password.hash(pin, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(pin, hash);
};
