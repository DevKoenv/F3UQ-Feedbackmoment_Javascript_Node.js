import { v4 as uuidv4 } from "uuid";

export class Event {
  public id: string;
  public createdAt: string;
  public updatedAt: string;

  constructor(
    public title: string,
    public description: string,
    public date: string,
    public organizer: string
  ) {
    this.id = uuidv4();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  updateDetails(title: string, description: string, date: string): void {
    this.title = title;
    this.description = description;
    this.date = date;
    this.updatedAt = new Date().toISOString();
  }

  isUpcoming(): boolean {
    return new Date(this.date) > new Date();
  }
}
