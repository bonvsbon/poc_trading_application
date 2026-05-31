import { Injectable } from '@nestjs/common';

@Injectable()
export class ClockService {
  now(): Date {
    return new Date();
  }

  isoTimestamp(): string {
    return this.now().toISOString();
  }

  marketTime(): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/New_York',
    }).format(this.now());
  }

  shortTime(): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/New_York',
    }).format(this.now());
  }
}
