const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export type User = { id: number; name: string; age: number };

const USERS = [
  { id: 1, name: 'John', age: 72 },
  { id: 2, name: 'Jane', age: 34 },
  { id: 3, name: 'Alice', age: 29 },
  { id: 4, name: 'Bob', age: 45 },
  { id: 5, name: 'Charlie', age: 53 },
] satisfies User[];

class UsersRepo {
  public async getUsers() {
    const isError = Math.floor(Math.random() * 10) >= 5;

    await delay();

    if (isError) {
      throw new Error('Failed to fetch users');
    }

    return USERS;
  }

  public async getUserByName(name: string) {
    await delay(200);

    return (
      USERS.find((user) =>
        user.name.toLowerCase().includes(name.toLowerCase()),
      ) || null
    );
  }
}

export default UsersRepo;
