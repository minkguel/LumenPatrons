export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  userType: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  userType: string;
};

export async function signIn(
  email: string,
  _password: string
): Promise<AuthUser> {
  await delay(600);
  return {
    id: "mock-user-1",
    email,
    fullName: email.split("@")[0],
    userType: "Founder",
  };
}

export async function signUp(data: SignUpInput): Promise<AuthUser> {
  await delay(600);
  return {
    id: "mock-user-1",
    email: data.email,
    fullName: data.fullName,
    userType: data.userType,
  };
}

export async function signOut(): Promise<void> {
  await delay(200);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
