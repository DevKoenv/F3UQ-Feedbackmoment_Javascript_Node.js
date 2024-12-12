import bcrypt from "bcryptjs";

export class User {
  constructor(
    public id: number,
    public username: string,
    public password: string,
    public createdAt: string,
  ) {}

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
