export class Event {
  constructor(
    public id: number,
    public title: string,
    public description: string,
    public date: string,
    public organizer: string,
    public createdAt: string,
  ) {}

  isUpcoming(): boolean {
    return new Date(this.date) > new Date();
  }
}
