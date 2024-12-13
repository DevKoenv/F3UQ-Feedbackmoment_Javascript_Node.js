import { v4 as uuidv4 } from 'uuid';
import { compare } from 'bcryptjs';

export class User {
  public id: string;
  public createdAt: string;

  constructor(
    public username: string,
    public password: string
  ) {
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    if (!password || password.length < 6) {
      throw new Error(`Password must be at least 6 characters long.`);
    }

    this.id = uuidv4();
    this.username = username;
    this.password = password;
    this.createdAt = new Date().toISOString();
  }

  async validatePassword(password: string): Promise<boolean> {
    return compare(password, this.password);
  }
}
