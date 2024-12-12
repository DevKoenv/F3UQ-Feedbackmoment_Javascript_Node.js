import chalk from "chalk";

class Logger {
  private static dateTimePad(value: number, digits: number): string {
    let number = value.toString();
    while (number.length < digits) {
      number = "0" + number;
    }
    return number;
  }

  private static format(tDate: Date): string {
    return (
      tDate.getFullYear() +
      "-" +
      this.dateTimePad(tDate.getMonth() + 1, 2) +
      "-" +
      this.dateTimePad(tDate.getDate(), 2) +
      " " +
      this.dateTimePad(tDate.getHours(), 2) +
      ":" +
      this.dateTimePad(tDate.getMinutes(), 2) +
      ":" +
      this.dateTimePad(tDate.getSeconds(), 2) +
      "." +
      this.dateTimePad(tDate.getMilliseconds(), 3)
    );
  }

  private static logMessage(
    args: any[],
    type: string,
    color: (text: string) => string,
  ): void {
    const timestamp = new Date(Date.now());
    const date = `[${this.format(timestamp)}]:`;
    const coloredType = color(type.toUpperCase());
    console.log(date, coloredType, ...args);
  }

  static log(...args: any[]): void {
    this.logMessage(args, "log", chalk.bgBlue);
  }

  static warn(...args: any[]): void {
    this.logMessage(args, "warn", chalk.black.bgYellow);
  }

  static error(...args: any[]): void {
    this.logMessage(args, "error", chalk.black.bgRed);
  }

  static debug(...args: any[]): void {
    this.logMessage(args, "debug", chalk.green);
  }

  static ready(...args: any[]): void {
    this.logMessage(args, "ready", chalk.black.bgGreen);
  }
}

export default Logger;
