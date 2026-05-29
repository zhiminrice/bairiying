import client from './client';

export async function login(account, password) {
  const { data } = await client.post('/auth/login', { account, password });
  return data;
}

export async function me() {
  const { data } = await client.get('/auth/me');
  return data;
}
