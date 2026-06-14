import 'dayjs';
import dayjs from 'dayjs';

declare module 'dayjs' {
  interface Dayjs {
    week(value?: number): Dayjs;
  }
}
